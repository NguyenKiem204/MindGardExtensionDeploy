// Test script for Pexels API
// Copy this to Postman or run with Node.js

const API_KEY = 'jUEcf5OITKSo9C0ttQdv4WWep56E3G5fUuv6FKTPVQ8l2xqOaX8a45xj';
const VIDEO_IDS = ['9428388', '856234', '1234567'];

console.log('=== PEXELS API TEST ===');
console.log('API Key:', API_KEY.substring(0, 10) + '...');
console.log('Video IDs:', VIDEO_IDS);
console.log('');

// Test 1: Get video by ID
async function testVideoById(id) {
  console.log(`\n--- Testing Video ID: ${id} ---`);
  
  const url = `https://api.pexels.com/videos/videos/${id}`;
  const headers = {
    'Authorization': API_KEY,
    'Content-Type': 'application/json'
  };
  
  console.log('URL:', url);
  console.log('Headers:', headers);
  
  try {
    const response = await fetch(url, { headers });
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Video data:');
      console.log('- ID:', data.id);
      console.log('- User:', data.user?.name);
      console.log('- Duration:', data.duration);
      console.log('- Image:', data.image);
      console.log('- Video Files:', data.video_files?.length || 0);
      
      if (data.video_files && data.video_files.length > 0) {
        const hdFile = data.video_files.find(f => f.quality === "hd");
        const firstFile = data.video_files[0];
        const fileToUse = hdFile || firstFile;
        console.log('- HD File:', hdFile ? 'Found' : 'Not found');
        console.log('- File Link:', fileToUse?.link);
        console.log('- File Quality:', fileToUse?.quality);
      }
    } else {
      const errorText = await response.text();
      console.log('Error Response:', errorText);
    }
  } catch (error) {
    console.log('Fetch Error:', error.message);
  }
}

// Test 2: Search videos by query
async function testVideoSearch(query) {
  console.log(`\n--- Testing Search: "${query}" ---`);
  
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=3`;
  const headers = {
    'Authorization': API_KEY,
    'Content-Type': 'application/json'
  };
  
  console.log('URL:', url);
  console.log('Headers:', headers);
  
  try {
    const response = await fetch(url, { headers });
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Search results:');
      console.log('- Total Results:', data.total_results);
      console.log('- Per Page:', data.per_page);
      console.log('- Videos Found:', data.videos?.length || 0);
      
      if (data.videos && data.videos.length > 0) {
        data.videos.forEach((video, index) => {
          console.log(`\nVideo ${index + 1}:`);
          console.log('- ID:', video.id);
          console.log('- User:', video.user?.name);
          console.log('- Duration:', video.duration);
          console.log('- Image:', video.image);
          console.log('- Video Files:', video.video_files?.length || 0);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('Error Response:', errorText);
    }
  } catch (error) {
    console.log('Fetch Error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('Starting Pexels API tests...\n');
  
  // Test video IDs
  for (const id of VIDEO_IDS) {
    await testVideoById(id);
  }
  
  // Test search queries
  const searchQueries = ['focus study', 'concentration', 'meditation', 'nature', 'rain', 'forest'];
  for (const query of searchQueries) {
    await testVideoSearch(query);
  }
  
  console.log('\n=== TESTS COMPLETED ===');
}

// Export for use in browser console or Node.js
if (typeof window !== 'undefined') {
  window.runPexelsTests = runTests;
  console.log('Tests loaded! Run runPexelsTests() in browser console');
} else {
  runTests();
}

// POSTMAN COLLECTION JSON
const postmanCollection = {
  "info": {
    "name": "Pexels API Test",
    "description": "Test Pexels API endpoints"
  },
  "item": [
    {
      "name": "Get Video by ID - 9428388",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "jUEcf5OITKSo9C0ttQdv4WWep56E3G5fUuv6FKTPVQ8l2xqOaX8a45xj"
          }
        ],
        "url": {
          "raw": "https://api.pexels.com/videos/videos/9428388",
          "protocol": "https",
          "host": ["api", "pexels", "com"],
          "path": ["videos", "videos", "9428388"]
        }
      }
    },
    {
      "name": "Get Video by ID - 856234",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "jUEcf5OITKSo9C0ttQdv4WWep56E3G5fUuv6FKTPVQ8l2xqOaX8a45xj"
          }
        ],
        "url": {
          "raw": "https://api.pexels.com/videos/videos/856234",
          "protocol": "https",
          "host": ["api", "pexels", "com"],
          "path": ["videos", "videos", "856234"]
        }
      }
    },
    {
      "name": "Get Video by ID - 1234567",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "jUEcf5OITKSo9C0ttQdv4WWep56E3G5fUuv6FKTPVQ8l2xqOaX8a45xj"
          }
        ],
        "url": {
          "raw": "https://api.pexels.com/videos/videos/1234567",
          "protocol": "https",
          "host": ["api", "pexels", "com"],
          "path": ["videos", "videos", "1234567"]
        }
      }
    },
    {
      "name": "Search Videos - focus study",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "jUEcf5OITKSo9C0ttQdv4WWep56E3G5fUuv6FKTPVQ8l2xqOaX8a45xj"
          }
        ],
        "url": {
          "raw": "https://api.pexels.com/videos/search?query=focus%20study&per_page=3",
          "protocol": "https",
          "host": ["api", "pexels", "com"],
          "path": ["videos", "search"],
          "query": [
            {
              "key": "query",
              "value": "focus study"
            },
            {
              "key": "per_page",
              "value": "3"
            }
          ]
        }
      }
    },
    {
      "name": "Search Videos - concentration",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "jUEcf5OITKSo9C0ttQdv4WWep56E3G5fUuv6FKTPVQ8l2xqOaX8a45xj"
          }
        ],
        "url": {
          "raw": "https://api.pexels.com/videos/search?query=concentration&per_page=3",
          "protocol": "https",
          "host": ["api", "pexels", "com"],
          "path": ["videos", "search"],
          "query": [
            {
              "key": "query",
              "value": "concentration"
            },
            {
              "key": "per_page",
              "value": "3"
            }
          ]
        }
      }
    }
  ]
};

console.log('\n=== POSTMAN COLLECTION ===');
console.log('Copy this JSON to import into Postman:');
console.log(JSON.stringify(postmanCollection, null, 2));
