import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, XCircle, Phone, Mail, MapPin, Clock } from "lucide-react";

const SoldOut = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white mx-auto mb-6">
            <XCircle className="w-10 h-10" />
          </div>
          
          <h1 className="text-2xl font-bold text-red-600 mb-4">Plot Sold Out</h1>
          
          <p className="text-gray-600 mb-6">
            This plot is no longer available for purchase. It has been sold to another customer.
          </p>
          
          <div className="bg-red-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-red-700 mb-3">Next Steps:</h2>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700 font-medium">Contact our sales team for similar available plots</p>
                  <p className="text-sm text-gray-600">+91 98765 43210</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700 font-medium">Explore other ventures in the same location</p>
                  <p className="text-sm text-gray-600">Visit our office for more options</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700 font-medium">Schedule a visit to our office for more options</p>
                  <p className="text-sm text-gray-600">Mon-Sat: 9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Contact Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Mobile:</span>
                <span className="font-medium">+91 98765 43210</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">sales@estatehub.com</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Office:</span>
                <span className="font-medium">Bhogapuram, Visakhapatnam</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Hours:</span>
                <span className="font-medium">9:00 AM - 6:00 PM</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoldOut;
