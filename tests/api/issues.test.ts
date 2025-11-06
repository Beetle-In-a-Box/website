import { POST, GET } from '@/app/api/issues/route';
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/issues/[id]/route';
import { prismaMock } from '@/utils/prisma-test';
import { NextRequest } from 'next/server';
import * as fileUpload from '@/utils/file-upload';

// Mock file upload utility
jest.mock('@/utils/file-upload', () => ({
  saveImage: jest.fn().mockResolvedValue('/Issue-1/Images/test-image.jpg'),
  validateImageFile: jest.fn().mockReturnValue({ valid: true }),
}));

describe('Issues API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/issues', () => {
    it('should create a new issue without image', async () => {
      const mockIssue = {
        id: 'issue-1',
        title: 'Issue 1',
        number: 1,
        date: 'August 2025',
        imageUrl: null,
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.issue.findUnique.mockResolvedValue(null);
      prismaMock.issue.create.mockResolvedValue(mockIssue);

      const formData = new FormData();
      formData.append('title', 'Issue 1');
      formData.append('number', '1');
      formData.append('date', 'August 2025');
      formData.append('published', 'false');

      const request = new NextRequest('http://localhost:3000/api/issues', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe('Issue 1');
      expect(data.number).toBe(1);
      expect(data.imageUrl).toBeNull();
    });

    it('should create a new issue with image', async () => {
      const mockIssue = {
        id: 'issue-1',
        title: 'Issue 1',
        number: 1,
        date: 'August 2025',
        imageUrl: '/Issue-1/Images/test-image.jpg',
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.issue.findUnique.mockResolvedValue(null);
      prismaMock.issue.create.mockResolvedValue(mockIssue);

      const formData = new FormData();
      formData.append('title', 'Issue 1');
      formData.append('number', '1');
      formData.append('date', 'August 2025');
      formData.append('published', 'false');
      formData.append('image', new File(['fake image'], 'cover.jpg', { type: 'image/jpeg' }));

      const request = new NextRequest('http://localhost:3000/api/issues', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(fileUpload.validateImageFile).toHaveBeenCalled();
      expect(fileUpload.saveImage).toHaveBeenCalled();
      expect(data.imageUrl).toBe('/Issue-1/Images/test-image.jpg');
    });

    it('should return 400 if image validation fails', async () => {
      (fileUpload.validateImageFile as jest.Mock).mockReturnValueOnce({
        valid: false,
        error: 'File is too large. Maximum size is 10MB.',
      });

      prismaMock.issue.findUnique.mockResolvedValue(null);

      const formData = new FormData();
      formData.append('title', 'Issue 1');
      formData.append('number', '1');
      formData.append('date', 'August 2025');
      formData.append('image', new File(['fake large image'], 'large.jpg', { type: 'image/jpeg' }));

      const request = new NextRequest('http://localhost:3000/api/issues', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('too large');
    });

    it('should return 409 if issue number already exists', async () => {
      const existingIssue = {
        id: 'issue-1',
        title: 'Issue 1',
        number: 1,
        date: 'August 2025',
        imageUrl: null,
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.issue.findUnique.mockResolvedValue(existingIssue);

      const formData = new FormData();
      formData.append('title', 'Issue 1');
      formData.append('number', '1');
      formData.append('date', 'August 2025');
      formData.append('published', 'false');

      const request = new NextRequest('http://localhost:3000/api/issues', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });

    it('should return 400 if required fields are missing', async () => {
      const formData = new FormData();
      formData.append('title', 'Issue 1');
      // Missing number and date

      const request = new NextRequest('http://localhost:3000/api/issues', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });
  });

  describe('GET /api/issues', () => {
    it('should return all issues with articles', async () => {
      const mockIssues = [
        {
          id: 'issue-1',
          title: 'Issue 1',
          number: 1,
          date: 'August 2025',
          imageUrl: null,
          published: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          articles: [],
        },
      ];

      prismaMock.issue.findMany.mockResolvedValue(mockIssues);

      const request = new NextRequest('http://localhost:3000/api/issues');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe('Issue 1');
    });

    it('should filter by published status', async () => {
      const mockIssues = [
        {
          id: 'issue-1',
          title: 'Issue 1',
          number: 1,
          date: 'August 2025',
          imageUrl: null,
          published: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          articles: [],
        },
      ];

      prismaMock.issue.findMany.mockResolvedValue(mockIssues);

      const request = new NextRequest('http://localhost:3000/api/issues?published=true');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prismaMock.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { published: true },
        })
      );
    });
  });

  describe('GET /api/issues/[id]', () => {
    it('should return a specific issue', async () => {
      const mockIssue = {
        id: 'issue-1',
        title: 'Issue 1',
        number: 1,
        date: 'August 2025',
        imageUrl: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        articles: [],
      };

      prismaMock.issue.findUnique.mockResolvedValue(mockIssue);

      const request = new NextRequest('http://localhost:3000/api/issues/issue-1');

      const response = await GET_BY_ID(request, { params: { id: 'issue-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('issue-1');
      expect(data.title).toBe('Issue 1');
    });

    it('should return 404 if issue not found', async () => {
      prismaMock.issue.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/issues/nonexistent');

      const response = await GET_BY_ID(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });

  describe('PUT /api/issues/[id]', () => {
    it('should update an existing issue without changing image', async () => {
      const existingIssue = {
        id: 'issue-1',
        title: 'Issue 1',
        number: 1,
        date: 'August 2025',
        imageUrl: '/Issue-1/Images/old-image.jpg',
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedIssue = {
        ...existingIssue,
        title: 'Issue 1 Updated',
        published: true,
        articles: [],
      };

      prismaMock.issue.findUnique.mockResolvedValue(existingIssue);
      prismaMock.issue.update.mockResolvedValue(updatedIssue);

      const formData = new FormData();
      formData.append('title', 'Issue 1 Updated');
      formData.append('number', '1');
      formData.append('date', 'August 2025');
      formData.append('published', 'true');

      const request = new NextRequest('http://localhost:3000/api/issues/issue-1', {
        method: 'PUT',
        body: formData,
      });

      const response = await PUT(request, { params: { id: 'issue-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Issue 1 Updated');
      expect(data.published).toBe(true);
    });

    it('should update issue with new image', async () => {
      const existingIssue = {
        id: 'issue-1',
        title: 'Issue 1',
        number: 1,
        date: 'August 2025',
        imageUrl: '/Issue-1/Images/old-image.jpg',
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedIssue = {
        ...existingIssue,
        imageUrl: '/Issue-1/Images/test-image.jpg',
        articles: [],
      };

      prismaMock.issue.findUnique.mockResolvedValue(existingIssue);
      prismaMock.issue.update.mockResolvedValue(updatedIssue);

      const formData = new FormData();
      formData.append('title', 'Issue 1');
      formData.append('number', '1');
      formData.append('date', 'August 2025');
      formData.append('published', 'false');
      formData.append('image', new File(['new image'], 'new-cover.jpg', { type: 'image/jpeg' }));

      const request = new NextRequest('http://localhost:3000/api/issues/issue-1', {
        method: 'PUT',
        body: formData,
      });

      const response = await PUT(request, { params: { id: 'issue-1' } });

      expect(fileUpload.validateImageFile).toHaveBeenCalled();
      expect(fileUpload.saveImage).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should return 404 if issue not found', async () => {
      prismaMock.issue.findUnique.mockResolvedValue(null);

      const formData = new FormData();
      formData.append('title', 'Issue 1');
      formData.append('number', '1');
      formData.append('date', 'August 2025');
      formData.append('published', 'false');

      const request = new NextRequest('http://localhost:3000/api/issues/nonexistent', {
        method: 'PUT',
        body: formData,
      });

      const response = await PUT(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });

  describe('DELETE /api/issues/[id]', () => {
    it('should delete an issue', async () => {
      const mockIssue = {
        id: 'issue-1',
        title: 'Issue 1',
        number: 1,
        date: 'August 2025',
        imageUrl: null,
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        articles: [],
      };

      prismaMock.issue.findUnique.mockResolvedValue(mockIssue);
      prismaMock.issue.delete.mockResolvedValue(mockIssue);

      const request = new NextRequest('http://localhost:3000/api/issues/issue-1');

      const response = await DELETE(request, { params: { id: 'issue-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('deleted successfully');
    });

    it('should return 404 if issue not found', async () => {
      prismaMock.issue.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/issues/nonexistent');

      const response = await DELETE(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });
});
