// Test Image Loading Issues
console.log('🔍 Diagnosing Image Loading Issues');
console.log('');

// Test basic image loading in browser context
const testImageUrls = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1541888946425-80966e031709?w=800&h=600&fit=crop'
];

async function diagnoseImageIssues() {
  console.log('Testing image accessibility...');
  
  for (let i = 0; i < testImageUrls.length; i++) {
    const url = testImageUrls[i];
    console.log(`\n${i + 1}. Testing: ${url.substring(0, 50)}...`);
    
    try {
      // Test with HEAD request first
      const headResponse = await fetch(url, { method: 'HEAD' });
      console.log(`   HEAD Status: ${headResponse.status}`);
      
      if (headResponse.ok) {
        // Test with GET request to ensure full image loads
        const getResponse = await fetch(url);
        if (getResponse.ok) {
          const blob = await getResponse.blob();
          console.log(`   ✅ Image loads successfully`);
          console.log(`   📏 Size: ${blob.size} bytes`);
          console.log(`   🎨 Type: ${blob.type}`);
        } else {
          console.log(`   ❌ GET request failed: ${getResponse.status}`);
        }
      } else {
        console.log(`   ❌ HEAD request failed: ${headResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }
  }
}

// Alternative image sources to try
const alternativeImages = [
  'https://picsum.photos/800/600?random=1',
  'https://picsum.photos/800/600?random=2',
  'https://picsum.photos/800/600?random=3',
  'https://picsum.photos/800/600?random=4',
  'https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=Luxury+Property',
  'https://via.placeholder.com/800x600/7B68EE/FFFFFF?text=Premium+Apartment',
  'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Modern+Villa',
  'https://via.placeholder.com/800x600/4ECDC4/FFFFFF?text=Beach+House'
];

async function testAlternativeImages() {
  console.log('\n🔄 Testing Alternative Image Sources...');
  
  for (let i = 0; i < Math.min(4, alternativeImages.length); i++) {
    const url = alternativeImages[i];
    console.log(`\n${i + 1}. Testing: ${url.substring(0, 50)}...`);
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        console.log(`   ✅ Alternative image works: ${response.status}`);
      } else {
        console.log(`   ❌ Alternative failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }
  }
}

// Run diagnostics
diagnoseImageIssues().then(() => {
  return testAlternativeImages();
}).then(() => {
  console.log('\n🔧 Recommended Solutions:');
  console.log('');
  console.log('1. ✅ Use reliable image sources:');
  console.log('   - Picsum Photos: https://picsum.photos/800/600?random=1');
  console.log('   - Placeholder images: https://via.placeholder.com/800x600');
  console.log('');
  console.log('2. ✅ Update NewVentures component with fallback images');
  console.log('3. ✅ Add proper error handling');
  console.log('4. ✅ Test with different image sources');
  console.log('');
  console.log('🚀 Next Steps:');
  console.log('1. Update image URLs in NewVentures component');
  console.log('2. Add multiple fallback options');
  console.log('3. Test image loading in browser');
  console.log('4. Verify display with proper aspect ratios');
});

module.exports = { diagnoseImageIssues, testAlternativeImages };
