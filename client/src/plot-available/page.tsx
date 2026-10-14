import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, CheckCircle, CreditCard } from "lucide-react";

const PlotAvailable = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>

          <h1 className="text-2xl font-bold text-green-600 mb-4">Plot Available</h1>

          <p className="text-gray-600 mb-6">
            This plot is currently available for purchase. Proceed with payment to secure this plot.
          </p>

          <div className="space-y-3 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-700 mb-2">What This Means:</h3>
              <ul className="text-sm text-gray-700 space-y-1 text-left">
                <li>- The plot is available for immediate purchase</li>
                <li>- No prior booking or reservation exists</li>
                <li>- Ready for documentation and registration</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-700 mb-2">Next Steps:</h3>
              <ul className="text-sm text-gray-700 space-y-1 text-left">
                <li>- Proceed to payment to secure the plot</li>
                <li>- Complete booking and payment formalities</li>
                <li>- Receive confirmation and documentation</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => navigate("/payment")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Proceed to Payment
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/ventures")}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Ventures
            </button>

            <button
              onClick={() => navigate("/")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlotAvailable;