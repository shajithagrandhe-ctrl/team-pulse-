// Test different image sources and CORS issues
console.log('🔍 Testing Image Loading Issues and CORS');
console.log('');

// Test 1: Check if it's a CORS issue
async function testCORSIssues() {
  console.log('1. Testing CORS issues...');
  
  const testUrl = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop';
  
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      mode: 'cors' // This will tell us if CORS is the issue
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   CORS Headers:`, response.headers.get('Access-Control-Allow-Origin'));
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      console.log('   ✅ No CORS issues detected');
    } else {
      console.log('   ❌ Possible CORS or network issue');
    }
  } catch (error) {
    console.log(`   ❌ CORS/Network Error: ${error.message}`);
  }
}

// Test 2: Try alternative reliable image sources
const alternativeSources = [
  'https://picsum.photos/id/1/800/600', // Specific Picsum ID
  'https://picsum.photos/id/2/800/600',
  'https://picsum.photos/id/3/800/600',
  'https://dummyimage.com/800x600/4A90E2/FFFFFF&text=Luxury+Property',
  'https://dummyimage.com/800x600/7B68EE/FFFFFF&text=Premium+Apartment',
  'https://dummyimage.com/800x600/FF6B6B/FFFFFF&text=Modern+Villa',
  'https://placehold.co/800x600/4A90E2/FFFFFF?text=Luxury+Property',
  'https://placehold.co/800x600/7B68EE/FFFFFF?text=Premium+Apartment'
];

async function testAlternativeSources() {
  console.log('\n2. Testing alternative image sources...');
  
  for (let i = 0; i < Math.min(4, alternativeSources.length); i++) {
    const url = alternativeSources[i];
    console.log(`\n   Testing: ${url.substring(0, 50)}...`);
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        console.log(`   ✅ Alternative works: ${response.status}`);
        console.log(`   📏 Size: ${response.headers.get('content-length')} bytes`);
      } else {
        console.log(`   ❌ Alternative failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }
  }
}

// Test 3: Create local data URLs as fallback
function createDataURLs() {
  console.log('\n3. Creating local data URL fallbacks...');
  
  // Simple SVG placeholders as data URLs
  const svgPlaceholders = [
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzRBOTBFMiIvPjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5MdXh1cnkgUHJvcGVydHk8L3RleHQ+PC9zdmc+',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzdCNjhFRSIvPjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QcmVtaXVtIEFwYXJ0bWVudDwvdGV4dD48L3N2Zz4=',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI0ZGNkI2Qi8+PHRleHQgeD0iNDAwIiB5PSIzMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk1vZGVybiBWaWxsYTwvdGV4dD48L3N2Zz4='
  ];
  
  return svgPlaceholders;
}

// Run all tests
async function runAllTests() {
  await testCORSIssues();
  await testAlternativeSources();
  
  const dataURLs = createDataURLs();
  console.log('\n📋 Recommended Solution:');
  console.log('');
  console.log('1. ✅ Use data URLs as primary fallback');
  console.log('2. ✅ Update NewVentures with reliable sources');
  console.log('3. ✅ Add multiple fallback options');
  console.log('4. ✅ Test with local images first');
  console.log('');
  console.log('🔧 Update NewVentures component with:');
  console.log('- Primary: Working Unsplash URLs');
  console.log('- Fallback 1: Data URL SVG placeholders');
  console.log('- Fallback 2: Alternative image services');
  console.log('');
  console.log('📦 Data URLs created:');
  dataURLs.forEach((url, index) => {
    console.log(`${index + 1}. ${url.substring(0, 50)}...`);
  });
}

runAllTests();
