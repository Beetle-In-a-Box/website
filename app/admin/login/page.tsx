'use client'

import { useState } from 'react'
import styles from '../Admin.module.scss'

export default function AdminLogin() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            })

            if (response.ok) {
                // Full navigation rather than router.push(). The session cookie is
                // httpOnly and set by this response, and middleware re-checks it on
                // the server; a hard load guarantees the new cookie is in play and
                // sidesteps the client router's cached RSC payload for /admin.
                // (The previous router.push() + router.refresh() pair cancelled each
                // other out, leaving the user on the login page after a successful
                // login, which looked exactly like a failure.)
                window.location.assign('/admin')
                return
            } else {
                const data = await response.json()
                setError(data.error || 'Invalid password')
            }
        } catch {
            setError('Failed to login. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
                <h1>Admin Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            autoFocus
                            required
                        />
                    </div>
                    {error && <div className={styles.error}>{error}</div>}
                    <button
                        type="submit"
                        className={styles.btnPrimary}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    )
}
