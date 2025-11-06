import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Save uploaded image file to public directory
 * @param file - The uploaded file
 * @param issueNumber - Issue number for organizing files
 * @param prefix - Prefix for filename (e.g., 'issue', 'article')
 * @returns The public URL path to the saved image
 */
export async function saveImage(
  file: File,
  issueNumber: number,
  prefix: string = 'image'
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create directory structure: /public/Issue-{number}/Images/
  const issueDir = join(process.cwd(), 'public', `Issue-${issueNumber}`, 'Images');

  if (!existsSync(issueDir)) {
    await mkdir(issueDir, { recursive: true });
  }

  // Generate filename
  const extension = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const filename = `${prefix}-${timestamp}.${extension}`;

  // Save file
  const filepath = join(issueDir, filename);
  await writeFile(filepath, buffer);

  // Return public URL path
  return `/Issue-${issueNumber}/Images/${filename}`;
}

/**
 * Validate that uploaded file is an image
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

/**
 * Validate that uploaded file is a .docx document
 */
export function validateDocxFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. File must be a .docx document',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  return { valid: true };
}
