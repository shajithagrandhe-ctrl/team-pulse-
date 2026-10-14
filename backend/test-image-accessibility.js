// Test Image Accessibility
console.log('🖼️ Testing Image Accessibility for New Ventures');
console.log('');

const testImages = [
  'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
];

async function testImageAccessibility() {
  console.log('Testing image URLs...');
  
  for (let i = 0; i < testImages.length; i++) {
    const url = testImages[i];
    console.log(`\n${i + 1}. Testing: ${url.substring(0, 60)}...`);
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        console.log(`   ✅ Working: ${response.status}`);
        console.log(`   📏 Size: ${response.headers.get('content-length')} bytes`);
        console.log(`   🎨 Type: ${response.headers.get('content-type')}`);
      } else {
        console.log(`   ❌ Failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

testImageAccessibility().then(() => {
  console.log('\n🔧 Component Integration Checklist:');
  console.log('');
  console.log('✅ Step 1: Import the component');
  console.log('   import NewVentures from "@/components/NewVentures"');
  console.log('');
  console.log('✅ Step 2: Add to your app');
  console.log('   <NewVentures />');
  console.log('');
  console.log('✅ Step 3: Check browser console');
  console.log('   Look for any JavaScript errors');
  console.log('');
  console.log('✅ Step 4: Check network tab');
  console.log('   Verify images are loading (status 200)');
  console.log('');
  console.log('✅ Step 5: Verify component renders');
  console.log('   You should see EstateHub Premium Villas card');
  console.log('');
  console.log('🎯 What you should see:');
  console.log('• A card with "EstateHub Premium Villas"');
  console.log('• Luxury villa image (blue pool villa)');
  console.log('• Price: ₹45,00,000 - ₹85,00,000');
  console.log('• Location: Bhogapuram, Visakhapatnam');
  console.log('• "View Details" button');
  console.log('');
  console.log('🚀 If still not working:');
  console.log('• Share browser console errors');
  console.log('• Show me your app structure');
  console.log('• Tell me where you added the component');
});

testImageAccessibility();
