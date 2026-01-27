/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import toast from "react-hot-toast";

// !!! CHANGE THIS TO YOUR NUMBER (Country code + Number, no + or spaces) !!!
// Example: 919876543210 for India
const ADMIN_WHATSAPP_NUMBER = "9624592161";

interface SubscriptionCardProps {
  title: string;
  originalPrice: string;
  offerPrice: string;
  discountPercent: string;
  features: string[];
  planType: "manual" | "annual";
}

export function SubscriptionCard({
  title,
  originalPrice,
  offerPrice,
  discountPercent,
  features,
  planType,
}: SubscriptionCardProps) {
  const [showExtra, setShowExtra] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false); // 👈 ADD THIS

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    amount: offerPrice,
    code: "",
  });

  const [loadingUser, setLoadingUser] = useState(false);
  // We track if a file is selected just for validation,
  // though we can't send it automatically via WhatsApp link.
  const [hasFile, setHasFile] = useState(false);

  // Blinking Offer Timer
  useEffect(() => {
    const t = setTimeout(() => setShowExtra(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Fetch User Details when Modal Opens
  useEffect(() => {
    if (showModal) {
      const fetchUserData = async () => {
        setLoadingUser(true);
        try {
          const token = localStorage.getItem("authToken");
          if (!token) {
            setLoadingUser(false);
            return;
          }

          const res = await fetch(`/api/user/me.php`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setFormData((prev) => ({
                ...prev,
                name: data.user.name || "",
                email: data.user.email || "",
                phone: data.user.phone_no || "",
              }));
            }
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        } finally {
          setLoadingUser(false);
        }
      };
      fetchUserData();
    }
  }, [showModal]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Calculate Amount dynamically if code changes
      if (name === "code") {
        const code = value.toUpperCase();
        let finalAmount = offerPrice; // String like "₹100" or "₹1000/mo"
        
        // Extract number from string
        const numericPrice = parseInt(offerPrice.replace(/[^0-9]/g, "")); 
        
        if (planType === "manual" && code === "OMG") {
           // 20% OFF
           const discounted = Math.round(numericPrice * 0.8);
           finalAmount = "₹" + discounted;
        } else if (planType === "annual" && code === "GOD") {
           // 25% OFF
           const discounted = Math.round(numericPrice * 0.75);
           // preserve "/mo" if present
           finalAmount = "₹" + discounted + (offerPrice.includes("/mo") ? "/mo" : ""); 
        } else {
           // Revert to original
           finalAmount = offerPrice;
        }
        
        updated.amount = finalAmount;
      }
      return updated;
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setHasFile(true);
    } else {
      setHasFile(false);
    }
  };

  // ===== WHATSAPP SUBMIT HANDLER =====
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (submitting) return; // 👈 block double submit
    setSubmitting(true);

    try {
   

      const token = localStorage.getItem("authToken");

      // 2. Save Request to Database
      try {
        const res = await fetch("/api/dashboard/requests/create.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_name: formData.name,
            email: formData.email,
            plan_name: title,
            amount: formData.amount,
          }),
        });

        if (!res.ok) {
          console.error("Failed to save request");
        }
      } catch (error) {
        console.error("Error saving request", error);
      }

      // 4. Construct the Message
      const message =
        `*New Payment Submission* 🚀%0a%0a` +
        `*Name:* ${formData.name}%0a` +
        `*Email:* ${formData.email}%0a` +
        `*Phone:* ${formData.phone}%0a` +
        `*Plan:* ${title}%0a` +
        `*Amount:* ${formData.amount}%0a%0a` +
        `-----------------------%0a` +
        `📷 *NOTE:* I am attaching the payment screenshot below manually.`;

      // 5. Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${message}`;

      toast.success("Your credit will be given to you in 24 hours", {
        duration: 6000,
        icon: "⏳",
      });

      window.open(whatsappUrl, "_blank");

      // 8. Close Modal
      setShowModal(false);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false); // 👈 ALWAYS reset
    }
  };

  const extraText =
    planType === "annual" ? "🎉 EXTRA 25% OFF" : "🔥 EXTRA 20% OFF";

  return (
    <>
      <div className="relative rounded-3xl bg-white shadow-xl border border-gray-200 flex flex-col pt-16 overflow-visible transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-300 group">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-extrabold shadow-lg z-20">
          {discountPercent} OFF
        </div>

        {showExtra && (
          <div className="absolute top-14 right-4 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold animate-bounce shadow-lg z-20">
            {extraText}
          </div>
        )}

        <div className="p-8 flex flex-col flex-1">
          <h3 className="text-xl font-bold text-center mb-4 text-gray-900 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>

          <div className="text-center mb-6">
            <p className="text-sm text-gray-400 line-through">
              {originalPrice}
            </p>
            <p className="text-5xl font-extrabold text-blue-600">
              {offerPrice}
            </p>
            <p className="text-xs text-gray-500 mt-1">Limited time offer</p>
          </div>

          <ul className="space-y-3 flex-1">
            {features.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-gray-600"
              >
                <div className="shrink-0 w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">
                  ✓
                </div>
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              const token = localStorage.getItem("authToken");
              if (!token) {
                toast.error("Please login to purchase a plan");
                window.dispatchEvent(new Event("open-login"));
              } else {
                setShowModal(true);
              }
            }}
            className="mt-8 py-3.5 rounded-full bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:bg-blue-700 hover:scale-[1.02] transition-all duration-200 active:scale-95"
          >
            Buy Now
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-green-600 p-4 flex justify-between items-center text-white rounded-t-2xl shrink-0">
              <h3 className="text-lg font-bold">Complete Payment</h3>
              <button
                onClick={() => setShowModal(false)}
                className="hover:bg-green-700 rounded-full p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {loadingUser ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 text-sm">
                    Fetching user details...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* QR Code Section */}
                  <div className="flex flex-col items-center justify-center mb-6 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Scan to Pay
                    </p>
                    <img
                      src="/qr1.png"
                      alt="PhonePe QR Code"
                      className="w-48 h-48 object-contain rounded-lg shadow-sm"
                    />
                    <div className="mt-3 text-center space-y-1">
                      <p className="text-sm font-medium text-gray-600">
                        UPI ID :{" "}
                        <span className="text-black font-bold select-all">
                          Q148055188@ybl
                        </span>
                      </p>
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                        SHRI MADHAVRAI ASSOCIATES
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm"
                        placeholder="Your Name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm"
                        placeholder="your@email.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm"
                        placeholder="Phone Number"
                        required
                      />
                    </div>
                    
                    {/* NEW CODE INPUT */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                         Discount Code
                      </label>
                      <div className="relative">
                         <input
                          type="text"
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange} 
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm uppercase"
                          placeholder="Enter Code"
                        />
                         {/* Show verification badge if valid */}
                        {( (planType === 'manual' && formData.code === 'OMG') || 
                           (planType === 'annual' && formData.code === 'GOD') ) && (
                             <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded-full">
                               APPLIED!
                             </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Basic plan: uses <b>OMG</b> (20% off). Annual plan: uses <b>GOD</b> (25% off).
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Amount to Pay
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="amount"
                          value={formData.amount}
                          readOnly
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-bold cursor-not-allowed text-sm"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 text-xs font-bold">
                          ✔ Auto-filled
                        </span>
                      </div>
                    </div>

                    
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full mt-6 py-3 rounded-xl font-bold transition shadow-lg flex justify-center items-center gap-2 ${
                      submitting
                        ? "bg-green-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {submitting ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Send on WhatsApp</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
