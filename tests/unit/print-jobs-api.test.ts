import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/v1/print/jobs/route';

describe('Real-Time Print Jobs API (/api/v1/print/jobs)', () => {
  const testVenue = `test-venue-${Date.now()}`;

  it('initially returns empty queue for new venue', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/print/jobs?slug=${testVenue}`);
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.jobs).toEqual([]);
    expect(data.totalCount).toBe(0);
  });

  it('rejects POST when photoStripUrl is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/print/jobs', {
      method: 'POST',
      body: JSON.stringify({ venueSlug: testVenue, name: 'Guest' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('successfully creates and dispatches a print job to the venue queue', async () => {
    const payload = {
      id: `job-1-${Date.now()}`,
      venueSlug: testVenue,
      name: 'نورة عبد العزيز',
      phone: '0551234567',
      photoStripUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      format: 'standard-2x6',
    };

    const postReq = new NextRequest('http://localhost:3000/api/v1/print/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const postRes = await POST(postReq);
    expect(postRes.status).toBe(200);
    const postData = await postRes.json();
    expect(postData.success).toBe(true);
    expect(postData.job.name).toBe('نورة عبد العزيز');
    expect(postData.job.status).toBe('pending');

    // Verify GET retrieves the queued job
    const getReq = new NextRequest(`http://localhost:3000/api/v1/print/jobs?slug=${testVenue}`);
    const getRes = await GET(getReq);
    const getData = await getRes.json();
    expect(getData.jobs.length).toBe(1);
    expect(getData.jobs[0].id).toBe(payload.id);
  });

  it('dismisses a job when staff completes it via DELETE', async () => {
    const jobId = `job-dismiss-${Date.now()}`;
    const payload = {
      id: jobId,
      venueSlug: testVenue,
      name: 'خالد وسلطان',
      photoStripUrl: 'data:image/png;base64,test',
    };

    await POST(new NextRequest('http://localhost:3000/api/v1/print/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }));

    const delReq = new NextRequest(`http://localhost:3000/api/v1/print/jobs?id=${jobId}&slug=${testVenue}`, {
      method: 'DELETE',
    });
    const delRes = await DELETE(delReq);
    expect(delRes.status).toBe(200);
    const delData = await delRes.json();
    expect(delData.success).toBe(true);

    // Verify it is removed
    const getReq = new NextRequest(`http://localhost:3000/api/v1/print/jobs?slug=${testVenue}`);
    const getRes = await GET(getReq);
    const getData = await getRes.json();
    expect(getData.jobs.some((j: any) => j.id === jobId)).toBe(false);
  });
});
