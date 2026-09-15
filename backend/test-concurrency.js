const http = require('http');

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3000;

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function testConcurrency() {
  console.log('--------------------------------------------------');
  console.log('⚡ STARTING ATOMIC CONCURRENCY CONTROL TEST');
  console.log('--------------------------------------------------\n');

  try {
    // 1. Create a new job (status = pending)
    console.log('1. Creating a new job with status: pending...');
    const createRes = await makeRequest(
      {
        hostname: API_HOST,
        port: API_PORT,
        path: '/jobs',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { title: 'Concurrent Processing Test', type: 'benchmark' }
    );

    if (createRes.statusCode !== 201) {
      console.error('❌ Job creation failed:', createRes);
      process.exit(1);
    }

    const jobId = createRes.body.id;
    console.log(`✅ Created Job ID: ${jobId}, Status: ${createRes.body.status}\n`);

    // 2. Fire two simultaneous status update requests to transition pending -> running
    console.log('2. Firing 2 SIMULTANEOUS PATCH requests (pending -> running)...');

    const updatePayload = { status: 'running' };
    const patchOptions = {
      hostname: API_HOST,
      port: API_PORT,
      path: `/jobs/${jobId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    };

    const [reqA, reqB] = await Promise.all([
      makeRequest(patchOptions, updatePayload),
      makeRequest(patchOptions, updatePayload),
    ]);

    console.log('\n--- RESULTS RECEIVED ---');
    console.log(`Request 1 Status: ${reqA.statusCode}`, reqA.body);
    console.log(`Request 2 Status: ${reqB.statusCode}`, reqB.body);
    console.log('------------------------\n');

    // 3. Assert exact concurrency contract: One 200 OK, One 409 Conflict
    const statusCodes = [reqA.statusCode, reqB.statusCode].sort();
    
    if (statusCodes[0] === 200 && statusCodes[1] === 409) {
      console.log('🎉 CONCURRENCY TEST PASSED!');
      console.log('✅ Exactly ONE request returned 200 OK.');
      console.log('✅ Exactly ONE request returned 409 Conflict.');
      console.log('✅ Database atomic update successfully prevented double transition race condition.');
    } else {
      console.error('❌ CONCURRENCY TEST FAILED! Expected [200, 409], received:', statusCodes);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error executing concurrency test:', error);
    process.exit(1);
  }
}

testConcurrency();
