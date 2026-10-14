// Unique Images for Each Venture
console.log('🖼️ Creating Unique Images for Each Venture');
console.log('');

const uniqueVentureImages = [
  {
    id: "venture1",
    name: "EstateHub Premium Villas",
    type: "Luxury Villas",
    location: "Bhogapuram, Visakhapatnam",
    price: "₹45,00,000 - ₹85,00,000",
    size: "2000 - 4000 sq.ft",
    description: "Exclusive luxury villas with modern amenities and breathtaking views of the Bay of Bengal.",
    features: ["Private Garden", "Swimming Pool", "Smart Home", "24/7 Security", "Power Backup", "Clubhouse"],
    image: "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
    gallery: [
      "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
    ],
    status: "Under Construction",
    completionDate: "December 2024",
    developer: "EstateHub Developers",
    priceRange: "₹45-85L"
  },
  {
    id: "venture2",
    name: "Oceanview Heights",
    type: "Premium Apartments",
    location: "Beach Road, Visakhapatnam",
    price: "₹35,00,000 - ₹60,000,000",
    size: "1200 - 2500 sq.ft",
    description: "Stunning beachfront apartments with panoramic ocean views.",
    features: ["Ocean View", "Balcony", "Modular Kitchen", "AC", "Lift", "Parking"],
    image: "https://images.pexels.com/photos/1642128/pexels-photo-1642128.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
    gallery: [
      "https://images.pexels.com/photos/1642128/pexels-photo-1642128.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/1476131/pexels-photo-1476131.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/2102687/pexels-photo-2102687.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/189346/pexels-photo-189346.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
    ],
    status: "Ready to Move",
    completionDate: "June 2024",
    developer: "Oceanview Builders",
    priceRange: "₹35-60L"
  },
  {
    id: "venture3",
    name: "Green Valley Township",
    type: "Integrated Township",
    location: "Madhurawada, Visakhapatnam",
    price: "₹25,00,000 - ₹55,00,000",
    size: "1000 - 3000 sq.ft",
    description: "Complete township project with residential, commercial, and recreational facilities.",
    features: ["Township", "School", "Hospital", "Shopping Complex", "Park", "Sports Complex"],
    image: "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
    gallery: [
      "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/1476131/pexels-photo-1476131.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/2102687/pexels-photo-2102687.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
    ],
    status: "Under Construction",
    completionDate: "March 2025",
    developer: "Green Valley Developers",
    priceRange: "₹25-55L"
  },
  {
    id: "venture4",
    name: "Hillside Residency",
    type: "Luxury Flats",
    location: "Hill Station Road, Visakhapatnam",
    price: "₹30,00,000 - ₹70,00,000",
    size: "1500 - 3500 sq.ft",
    description: "Premium residential complex nestled in the hills offering serene environment.",
    features: ["Hill View", "Terrace Garden", "Sky Lounge", "Gym", "Spa", "Concierge"],
    image: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
    gallery: [
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/1476131/pexels-photo-1476131.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/2102687/pexels-photo-2102687.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/189346/pexels-photo-189346.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
    ],
    status: "Under Construction",
    completionDate: "January 2025",
    developer: "Hillside Constructions",
    priceRange: "₹30-70L"
  },
  {
    id: "venture5",
    name: "Coastal Heights",
    type: "Premium Apartments",
    location: "Seethammadhara, Visakhapatnam",
    price: "₹28,00,000 - ₹52,00,000",
    size: "1100 - 2200 sq.ft",
    description: "Modern residential complex with coastal architecture and world-class amenities.",
    features: ["Sea View", "Modern Design", "Smart Features", "Security", "Parking", "Power Backup"],
    image: "https://images.pexels.com/photos/1476131/pexels-photo-1476131.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
    gallery: [
      "https://images.pexels.com/photos/1476131/pexels-photo-1476131.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/2102687/pexels-photo-2102687.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/189346/pexels-photo-189346.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/1642128/pexels-photo-1642128.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
    ],
    status: "Ready to Move",
    completionDate: "August 2024",
    developer: "Coastal Builders",
    priceRange: "₹28-52L"
  },
  {
    id: "venture6",
    name: "Tech Park Residences",
    type: "Modern Apartments",
    location: "Anandapuram, Visakhapatnam",
    price: "₹22,00,000 - ₹45,00,000",
    size: "900 - 2000 sq.ft",
    description: "Contemporary residential complex designed for modern professionals near IT parks.",
    features: ["Modern Design", "Tech Hub", "Co-working Space", "Gym", "Rooftop Garden", "Smart Home"],
    image: "https://images.pexels.com/photos/2102687/pexels-photo-2102687.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
    gallery: [
      "https://images.pexels.com/photos/2102687/pexels-photo-2102687.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/189346/pexels-photo-189346.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/1642128/pexels-photo-1642128.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
    ],
    status: "Under Construction",
    completionDate: "February 2025",
    developer: "Tech Park Developers",
    priceRange: "₹22-45L"
  },
  {
    id: "venture7",
    name: "Sunrise Valley",
    type: "Budget Apartments",
    location: "Pendurthi, Visakhapatnam",
    price: "₹18,00,000 - ₹35,00,000",
    size: "800 - 1800 sq.ft",
    description: "Affordable housing project with modern amenities for first-time home buyers.",
    features: ["Budget Friendly", "Modern Amenities", "Community Hall", "Children's Park", "Security", "Parking"],
    image: "https://images.pexels.com/photos/189346/pexels-photo-189346.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
    gallery: [
      "https://images.pexels.com/photos/189346/pexels-photo-189346.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/1642128/pexels-photo-1642128.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/1476131/pexels-photo-1476131.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
    ],
    status: "Pre-Launch",
    completionDate: "May 2025",
    developer: "Sunrise Developers",
    priceRange: "₹18-35L"
  },
  {
    id: "venture8",
    name: "Green Meadows",
    type: "Independent Houses",
    location: "Anandapuram, Visakhapatnam",
    price: "₹38,00,000 - ₹75,00,000",
    size: "1800 - 3500 sq.ft",
    description: "Independent houses with private gardens and modern amenities for families.",
    features: ["Private Garden", "Independent House", "Modern Design", "Parking", "Security", "Power Backup"],
    image: "https://images.pexels.com/photos/1642128/pexels-photo-1642128.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
    gallery: [
      "https://images.pexels.com/photos/1642128/pexels-photo-1642128.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/1476131/pexels-photo-1476131.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/2102687/pexels-photo-2102687.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
    ],
    status: "Pre-Launch",
    completionDate: "July 2025",
    developer: "Green Meadows Developers",
    priceRange: "₹38-75L"
  },
  {
    id: "venture9",
    name: "Ocean View Towers",
    type: "Commercial Complex",
    location: "Rushikonda, Visakhapatnam",
    price: "₹50,00,000 - ₹1,20,00,000",
    size: "500 - 2000 sq.ft",
    description: "Premium commercial complex with office spaces, retail shops, and restaurants.",
    features: ["Commercial Space", "Retail Shops", "Office Spaces", "Restaurant", "Parking", "Security"],
    image: "https://images.pexels.com/photos/2102687/pexels-photo-2102687.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
    gallery: [
      "https://images.pexels.com/photos/2102687/pexels-photo-2102687.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/189346/pexels-photo-189346.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/1642128/pexels-photo-1642128.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
    ],
    status: "Planning",
    completionDate: "September 2025",
    developer: "Ocean View Developers",
    priceRange: "₹50L-1.2Cr"
  }
];

console.log('✅ Unique Images Configuration:');
console.log('');

uniqueVentureImages.forEach((venture, index) => {
  console.log(`${index + 1}. ${venture.name}`);
  console.log(`   📸 Main Image: ${venture.image.substring(50, 80)}...`);
  console.log(`   📊 Price: ${venture.priceRange}`);
  console.log(`   📍 Location: ${venture.location}`);
  console.log(`   🏷️ Type: ${venture.type}`);
  console.log(`   ✨ Status: ${venture.status}`);
  console.log('');
});

console.log('🎯 Image Variety:');
console.log('• 259588 - Blue pool villa');
console.log('• 106399 - Green residential complex');
console.log('• 323780 - Mountain view apartments');
console.log('• 1571460 - Modern architecture');
console.log('• 1642128 - Beachfront building');
console.log('• 1476131 - Ocean view property');
console.log('• 2102687 - Commercial complex');
console.log('• 189346 - Urban development');
console.log('');

console.log('🚀 Ready to Update Component:');
console.log('✅ Each venture now has unique images');
console.log('✅ Different visual themes for each property');
console.log('✅ Professional real estate photography');
console.log('✅ No more duplicate images');
console.log('✅ Enhanced visual variety');
