const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const cloudName = 'tadfkray';
const apiKey = '761385951332425';
const apiSecret = 'wbX7xnRkM8lpYH5ErrfT2Btj7UM';

const founderFile = path.resolve(__dirname, 'Frontend/customer/public/anurag_founder.jpg');
const founderBase64 = 'data:image/jpeg;base64,' + fs.readFileSync(founderFile).toString('base64');

const itemsToUpload = [
  { id: 'cat_1_custom_carpentry', folder: 'apexservices/categories', file: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80' },
  { id: 'cat_2_emergency_plumbing', folder: 'apexservices/categories', file: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80' },
  { id: 'cat_3_electrical_maintenance', folder: 'apexservices/categories', file: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80' },
  { id: 'cat_4_painting_decor', folder: 'apexservices/categories', file: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80' },
  { id: 'cat_5_hvac_ac_service', folder: 'apexservices/categories', file: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80' },
  { id: 'cat_6_appliance_care', folder: 'apexservices/categories', file: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80' },
  { id: 'cat_7_deep_cleaning', folder: 'apexservices/categories', file: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80' },
  { id: 'cat_8_pest_control', folder: 'apexservices/categories', file: 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?auto=format&fit=crop&w=800&q=80' },
  { id: 'hero_slide_1', folder: 'apexservices/hero', file: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80' },
  { id: 'hero_slide_2', folder: 'apexservices/hero', file: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1400&q=80' },
  { id: 'hero_slide_3', folder: 'apexservices/hero', file: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=80' },
  { id: 'anurag_founder', folder: 'apexservices/founder', file: founderBase64 },
  { id: 'avatar_sarah', folder: 'apexservices/reviews', file: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
  { id: 'avatar_david', folder: 'apexservices/reviews', file: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
  { id: 'avatar_elena', folder: 'apexservices/reviews', file: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }
];

function uploadSingle(item) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const strToSign = `folder=${item.folder}&public_id=${item.id}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

    const postData = JSON.stringify({
      file: item.file,
      folder: item.folder,
      public_id: item.id,
      timestamp: timestamp,
      api_key: apiKey,
      signature: signature
    });

    const req = https.request({
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${cloudName}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            console.log(`[SUCCESS] ${item.id} -> ${parsed.secure_url}`);
            resolve({ id: item.id, secure_url: parsed.secure_url });
          } catch (e) {
            reject(new Error(`Failed to parse response for ${item.id}: ${e.message}`));
          }
        } else {
          console.error(`[ERROR] ${item.id} status ${res.statusCode}:`, data);
          reject(new Error(`Upload failed for ${item.id} with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log(`Starting Cloudinary migration for ${itemsToUpload.length} items...`);
  const results = {};
  for (const item of itemsToUpload) {
    try {
      const res = await uploadSingle(item);
      results[item.id] = res.secure_url;
    } catch (e) {
      console.error(e.message);
    }
  }

  const outPath = path.resolve(__dirname, 'cloudinary_manifest.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Wrote Cloudinary manifest to ${outPath}`);
}

main();
