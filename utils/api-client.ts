// API client utility functions for admin interface

export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

export interface Issue {
    id: string;
    title: string;
    number: number;
    date: string;
    imageUrl: string | null;
    published: boolean;
    createdAt: string;
    updatedAt: string;
    articles?: Article[];
}

export interface Article {
    id: string;
    title: string;
    shortTitle: string | null;
    author: string;
    number: number;
    content: string;
    citations: string;
    previewText: string;
    imageUrl: string | null;
    fileName: string;
    published: boolean;
    issueId: string;
    createdAt: string;
    updatedAt: string;
    issue?: Issue;
}

// Issues API functions

export async function fetchIssues(published?: boolean): Promise<ApiResponse<Issue[]>> {
    try {
        const url = published !== undefined
            ? `/api/issues?published=${published}`
            : '/api/issues';
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            return { data: null, error: errorData.error || 'Failed to fetch issues' };
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching issues:', error);
        return { data: null, error: 'Network error while fetching issues' };
    }
}

export async function fetchIssue(id: string): Promise<ApiResponse<Issue>> {
    try {
        const response = await fetch(`/api/issues/${id}`);

        if (!response.ok) {
            const errorData = await response.json();
            return { data: null, error: errorData.error || 'Failed to fetch issue' };
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching issue:', error);
        return { data: null, error: 'Network error while fetching issue' };
    }
}

export async function createIssue(formData: FormData): Promise<ApiResponse<Issue>> {
    try {
        const response = await fetch('/api/issues', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { data: null, error: errorData.error || 'Failed to create issue' };
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error creating issue:', error);
        return { data: null, error: 'Network error while creating issue' };
    }
}

export async function updateIssue(id: string, formData: FormData): Promise<ApiResponse<Issue>> {
    try {
        const response = await fetch(`/api/issues/${id}`, {
            method: 'PATCH',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { data: null, error: errorData.error || 'Failed to update issue' };
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error updating issue:', error);
        return { data: null, error: 'Network error while updating issue' };
    }
}

export async function deleteIssue(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
        const response = await fetch(`/api/issues/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { data: null, error: errorData.error || 'Failed to delete issue' };
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error deleting issue:', error);
        return { data: null, error: 'Network error while deleting issue' };
    }
}

// Articles API functions

export async function fetchArticles(issueId?: string, published?: boolean): Promise<ApiResponse<Article[]>> {
    try {
        const params = new URLSearchParams();
        if (issueId) params.append('issueId', issueId);
        if (published !== undefined) params.append('published', String(published));

        const url = params.toString() ? `/api/articles?${params}` : '/api/articles';
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            return { data: null, error: errorData.error || 'Failed to fetch articles' };
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching articles:', error);
        return { data: null, error: 'Network error while fetching articles' };
    }
}

export async function fetchArticle(id: string): Promise<ApiResponse<Article>> {
    try {
        const response = await fetch(`/api/articles/${id}`);

        if (!response.ok) {
            const errorData = await response.json();
            return { data: null, error: errorData.error || 'Failed to fetch article' };
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching article:', error);
        return { data: null, error: 'Network error while fetching article' };
    }
}

export async function createArticle(formData: FormData): Promise<ApiResponse<Article>> {
    try {
        const response = await fetch('/api/articles', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { data: null, error: errorData.error || 'Failed to create article' };
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error creating article:', error);
        return { data: null, error: 'Network error while creating article' };
    }
}

export async function updateArticle(id: string, formData: FormData): Promise<ApiResponse<Article>> {
    try {
        const response = await fetch(`/api/articles/${id}`, {
            method: 'PATCH',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { data: null, error: errorData.error || 'Failed to update article' };
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error updating article:', error);
        return { data: null, error: 'Network error while updating article' };
    }
}

export async function deleteArticle(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
        const response = await fetch(`/api/articles/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { data: null, error: errorData.error || 'Failed to delete article' };
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error deleting article:', error);
        return { data: null, error: 'Network error while deleting article' };
    }
}
