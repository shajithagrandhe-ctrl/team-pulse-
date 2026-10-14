import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Building,
  Car,
  Compass,
  DollarSign,
  Eye,
  Globe,
  Heart,
  Home,
  Image as ImageIcon,
  Mail,
  MapPin,
  Mountain,
  Pause,
  Phone,
  Play,
  Share2,
  Star,
  Trees,
  Users,
  VolumeX,
  Zap
} from "lucide-react";
import { formatINRTextToUnits } from "@/lib/money";

interface Venture {
  id: string;
  name: string;
  type: string;
  location: string;
  price: string;
  size: string;
  description: string;
  features: string[];
  image: string;
  gallery: string[];
  videos: string[];
  status: string;
  completionDate: string;
  developer: string;
  amenities: string[];
  nearbyPlaces: string[];
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  highlights: {
    totalUnits: number;
    availableUnits: number;
    averagePrice: string;
    possessionDate: string;
  };
  mediaType: "image" | "video";
}

const ventures: Venture[] = [
  {
    id: "venture1",
    name: "EstateHub Premium Villas",
    type: "Luxury Villas",
    location: "Bhogapuram, Visakhapatnam",
    price: "Rs.45,00,000 - Rs.85,00,000",
    size: "2000 - 4000 sq.ft",
    description:
      "Exclusive luxury villas with modern amenities and breathtaking views of the Bay of Bengal. Experience premium living with world-class facilities.",
    features: ["Private Garden", "Swimming Pool", "Smart Home", "24/7 Security", "Power Backup", "Clubhouse"],
    image: "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
    gallery: [
      "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
    ],
    videos: ["https://www.w3schools.com/html/mov_bbb.mp4"],
    mediaType: "image",
    status: "Under Construction",
    completionDate: "December 2024",
    developer: "EstateHub Developers",
    amenities: ["Gym", "Spa", "Children's Play Area", "Jogging Track", "Community Hall", "Indoor Games"],
    nearbyPlaces: [
      "International Airport (5km)",
      "Beach (2km)",
      "Shopping Mall (3km)",
      "School (1km)",
      "Hospital (2km)"
    ],
    contact: {
      phone: "+91 9876543210",
      email: "premium@estatehub.com",
      website: "www.estatehub-premium.com"
    },
    highlights: {
      totalUnits: 50,
      availableUnits: 12,
      averagePrice: "Rs.65,00,000",
      possessionDate: "December 2024"
    }
  },
  {
    id: "venture2",
    name: "Oceanview Heights",
    type: "Premium Apartments",
    location: "Beach Road, Visakhapatnam",
    price: "Rs.35,00,000 - Rs.60,00,000",
    size: "1200 - 2500 sq.ft",
    description:
      "Stunning beachfront apartments with panoramic ocean views. Modern architecture meets coastal living in this premium residential complex.",
    features: ["Ocean View", "Balcony", "Modular Kitchen", "AC", "Lift", "Parking"],
    image: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
    gallery: [
      "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
    ],
    videos: ["https://www.w3schools.com/html/movie.mp4"],
    mediaType: "image",
    status: "Ready to Move",
    completionDate: "June 2024",
    developer: "Oceanview Builders",
    amenities: ["Rooftop Garden", "Swimming Pool", "Gym", "Party Hall", "Security", "Power Backup"],
    nearbyPlaces: ["Beach (0.5km)", "Restaurant (1km)", "Hospital (2km)", "School (1.5km)", "Mall (3km)"],
    contact: {
      phone: "+91 9876543211",
      email: "info@oceanview.com",
      website: "www.oceanview-heights.com"
    },
    highlights: {
      totalUnits: 120,
      availableUnits: 8,
      averagePrice: "Rs.48,00,000",
      possessionDate: "Immediate"
    }
  },
  {
    id: "venture3",
    name: "Green Valley Township",
    type: "Integrated Township",
    location: "Madhurawada, Visakhapatnam",
    price: "Rs.25,00,000 - Rs.55,00,000",
    size: "1000 - 3000 sq.ft",
    description:
      "A complete township project with residential, commercial, and recreational facilities. Live, work, and play in one integrated community.",
    features: ["Township", "School", "Hospital", "Shopping Complex", "Park", "Sports Complex"],
    image: "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
    gallery: [
      "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800&h=600",
      "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
    ],
    videos: ["https://www.w3schools.com/html/mov_bbb.mp4"],
    mediaType: "image",
    status: "Under Construction",
    completionDate: "March 2025",
    developer: "Green Valley Developers",
    amenities: ["School", "Hospital", "Mall", "Park", "Temple", "Community Center"],
    nearbyPlaces: ["IT Park (3km)", "Airport (8km)", "Railway Station (5km)", "Beach (7km)", "Highway (1km)"],
    contact: {
      phone: "+91 9876543212",
      email: "sales@greenvalley.com",
      website: "www.greenvalley-township.com"
    },
    highlights: {
      totalUnits: 200,
      availableUnits: 45,
      averagePrice: "Rs.40,00,000",
      possessionDate: "March 2025"
    }
  }
];

const NewVentures = () => {
  const [selectedVenture, setSelectedVenture] = useState<Venture | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeMediaType, setActiveMediaType] = useState<"image" | "video">("image");
  const [isPlaying, setIsPlaying] = useState(false);
  const [likedVentures, setLikedVentures] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("all");

  const filteredVentures =
    filter === "all" ? ventures : ventures.filter((venture) => venture.status === filter);

  const handleLike = (ventureId: string) => {
    setLikedVentures((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ventureId)) {
        newSet.delete(ventureId);
      } else {
        newSet.add(ventureId);
      }
      return newSet;
    });
  };

  const handleShare = (venture: Venture) => {
    if (navigator.share) {
      navigator.share({
        title: venture.name,
        text: venture.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(
        `${venture.name} - ${venture.location}\n${venture.description}\n${venture.contact.website}`
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ready to Move":
        return "bg-green-100 text-green-800";
      case "Under Construction":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Luxury Villas":
        return <Home className="w-5 h-5" />;
      case "Premium Apartments":
        return <Building className="w-5 h-5" />;
      case "Integrated Township":
        return <Trees className="w-5 h-5" />;
      case "Luxury Flats":
        return <Mountain className="w-5 h-5" />;
      case "Modern Apartments":
        return <Zap className="w-5 h-5" />;
      default:
        return <Building className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Compass className="w-8 h-8 mr-3 text-blue-600" />
                New Ventures
              </h1>
              <p className="text-gray-600 mt-1">Discover premium properties in prime locations</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === "all"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("Ready to Move")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === "Ready to Move"
                      ? "bg-white text-green-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Ready to Move
                </button>
                <button
                  onClick={() => setFilter("Under Construction")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === "Under Construction"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Under Construction
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Ventures</p>
                  <p className="text-3xl font-bold">{ventures.length}</p>
                </div>
                <Building className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Ready to Move</p>
                  <p className="text-3xl font-bold">
                    {ventures.filter((venture) => venture.status === "Ready to Move").length}
                  </p>
                </div>
                <Home className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Under Construction</p>
                  <p className="text-3xl font-bold">
                    {ventures.filter((venture) => venture.status === "Under Construction").length}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Total Units</p>
                  <p className="text-3xl font-bold">
                    {ventures.reduce((sum, venture) => sum + venture.highlights.totalUnits, 0)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVentures.map((venture) => (
            <Card key={venture.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="relative h-64 overflow-hidden bg-gray-100">
                <img
                  src={venture.image}
                  alt={venture.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  onError={(event) => {
                    event.currentTarget.src =
                      "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800&h=600";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                <div className="absolute top-4 left-4">
                  <Badge className={getStatusColor(venture.status)}>{venture.status}</Badge>
                </div>

                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={() => handleLike(venture.id)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        likedVentures.has(venture.id) ? "fill-red-500 text-red-500" : "text-white"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleShare(venture)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-white" />
                  </button>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-xl font-bold">{venture.name}</h3>
                  <div className="flex items-center text-white/90 text-sm mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {venture.location}
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {getTypeIcon(venture.type)}
                    <span className="ml-2 text-sm text-gray-600">{venture.type}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{formatINRTextToUnits(venture.price)}</p>
                    <p className="text-xs text-gray-500">{venture.size}</p>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{venture.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {venture.features.slice(0, 3).map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {venture.features.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{venture.features.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm">
                    <Home className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{venture.highlights.totalUnits} Units</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Eye className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{venture.highlights.availableUnits} Available</span>
                  </div>
                </div>

                <Button
                  onClick={() => setSelectedVenture(venture)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedVenture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative h-96 bg-black">
              {activeMediaType === "image" ? (
                <img
                  src={selectedVenture.gallery[activeImageIndex]}
                  alt={selectedVenture.name}
                  className="w-full h-full object-cover object-center"
                  onError={(event) => {
                    event.currentTarget.src =
                      "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800&h=600";
                  }}
                />
              ) : (
                <video
                  src={selectedVenture.videos[activeImageIndex]}
                  className="w-full h-full object-cover object-center"
                  controls
                  autoPlay={false}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={() => {
                    setActiveMediaType("image");
                  }}
                >
                  <source src={selectedVenture.videos[activeImageIndex]} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              <div className="absolute top-4 left-4 flex space-x-2">
                <button
                  onClick={() => setActiveMediaType("image")}
                  className={`p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors ${
                    activeMediaType === "image" ? "bg-white/40" : ""
                  }`}
                >
                  <ImageIcon
                    className={`w-4 h-4 ${activeMediaType === "image" ? "text-blue-600" : "text-white"}`}
                  />
                </button>
                {selectedVenture.videos.length > 0 && (
                  <button
                    onClick={() => setActiveMediaType("video")}
                    className={`p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors ${
                      activeMediaType === "video" ? "bg-white/40" : ""
                    }`}
                  >
                    <Play className={`w-4 h-4 ${activeMediaType === "video" ? "text-blue-600" : "text-white"}`} />
                  </button>
                )}
              </div>

              {activeMediaType === "video" && (
                <div className="absolute bottom-4 left-4 flex items-center space-x-4">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                  </button>
                  <button
                    onClick={() => setIsPlaying(false)}
                    className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    <VolumeX className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setSelectedVenture(null);
                  setActiveMediaType("image");
                  setIsPlaying(false);
                }}
                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
              >
                <span className="text-white text-xl">x</span>
              </button>

              <div className="absolute bottom-4 left-4 right-4">
                {activeMediaType === "image" ? (
                  <div className="flex space-x-2">
                    {selectedVenture.gallery.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                          activeImageIndex === index ? "border-white" : "border-white/50"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover object-center"
                          onError={(event) => {
                            event.currentTarget.src =
                              "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800&h=600";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    {selectedVenture.videos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                          activeImageIndex === index ? "border-white" : "border-white/50"
                        }`}
                      >
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedVenture.name}</h2>
                  <div className="flex items-center text-gray-600 mt-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    {selectedVenture.location}
                  </div>
                </div>
                <Badge className={getStatusColor(selectedVenture.status)}>{selectedVenture.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Price Range</p>
                        <p className="text-lg font-bold text-gray-900">{formatINRTextToUnits(selectedVenture.price)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Home className="w-5 h-5 text-blue-600 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Size Range</p>
                        <p className="text-lg font-bold text-gray-900">{selectedVenture.size}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-gray-600">{selectedVenture.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedVenture.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-2" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedVenture.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      <Zap className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="text-sm text-gray-600">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Nearby Places</h3>
                <div className="space-y-2">
                  {selectedVenture.nearbyPlaces.map((place, index) => (
                    <div key={index} className="flex items-center">
                      <Car className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">{place}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm">{selectedVenture.contact.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm">{selectedVenture.contact.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm">{selectedVenture.contact.website}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Schedule Visit</Button>
                <Button variant="outline" className="flex-1">
                  Download Brochure
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewVentures;
