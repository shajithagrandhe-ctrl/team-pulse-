import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, CreditCard, CheckCircle, User, Phone, MapPin, Hash, DollarSign, Camera } from "lucide-react";
import { formatINRTextToUnits, formatINRUnits } from "@/lib/money";

const Payment = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const customerData = {
    name: "Rajesh Kumar",
    contactNumber: "+91 9876543210",
    location: "Bhogapuram",
    uniqueId: "CUST-2024-001",
    pricePerSqYard: 5000,
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  };

  const paymentAmount = 1000000;

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentComplete(true);
    }, 2000);
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h1>

            <p className="text-gray-600 mb-6">
              Your payment has been processed successfully. The plot has been secured in your name.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-700 mb-2">What&#39;s Next:</h3>
              <ul className="text-sm text-gray-700 space-y-1 text-left">
                <li>- You will receive confirmation via email</li>
                <li>- Documentation process will begin</li>
                <li>- Our team will contact you for next steps</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white mx-auto mb-6">
            <CreditCard className="w-10 h-10" />
          </div>

          <h1 className="text-2xl font-bold text-blue-600 mb-4">Payment Details</h1>

          <p className="text-gray-600 mb-6">
            Complete your payment to secure plot. All transactions are secure and encrypted.
          </p>

          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Customer Details</h3>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                  <img src={customerData.photo} alt="Customer" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{customerData.name}</p>
                  <p className="text-sm text-gray-600">ID: {customerData.uniqueId}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">Name:</span> {customerData.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">Contact:</span> {customerData.contactNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">Location:</span> {customerData.location}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">Unique ID:</span> {customerData.uniqueId}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">Price/Sq.Yard:</span> {formatINRUnits(customerData.pricePerSqYard)}/sq.yd
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">Photo:</span> Available
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-700 mb-2">Payment Amount</h3>
              <p className="text-2xl font-bold text-blue-600">{formatINRTextToUnits(`INR ${paymentAmount.toLocaleString("en-IN")}`)}</p>
              <p className="text-sm text-gray-600">Advance payment to secure plot</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Complete Payment
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/plot-available")}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={() => navigate("/")}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
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

export default Payment;
