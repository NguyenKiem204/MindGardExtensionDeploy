import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, ShieldCheck, Loader2, Sparkles, AlertCircle, CalendarClock, Check, Bookmark, FileText, Image as ImageIcon, BarChart3, ThumbsUp } from "lucide-react";
import { subscriptionService } from "../services/subscriptionService";
import { authService } from "../services/authService";

export default function SubscriptionModal({ isOpen, onClose, onUpgradeSuccess }) {
    const [plans, setPlans] = useState([]);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [isYearly, setIsYearly] = useState(false);

    // Payment state
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentData, setPaymentData] = useState(null); // { qrUrl, orderCode, amount, bankAccount, bankName }
    const [paymentStatus, setPaymentStatus] = useState("IDLE"); // IDLE, PENDING, SUCCESS, FAILED

    const pollingIntervalRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchPlans();
        } else {
            resetState();
        }

        return () => {
            stopPolling();
        };
    }, [isOpen]);

    const resetState = () => {
        setPaymentData(null);
        setPaymentStatus("IDLE");
        setIsProcessing(false);
        setError(null);
        stopPolling();
    };

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const isAuth = authService.isAuthenticated();
            const [plansData, currentSubData] = await Promise.all([
                subscriptionService.getActivePlans(),
                isAuth ? subscriptionService.getCurrentSubscription().catch(() => null) : Promise.resolve(null)
            ]);

            setPlans(plansData);
            if (currentSubData && currentSubData.status === 'ACTIVE') {
                setCurrentSubscription(currentSubData);
            } else {
                setCurrentSubscription(null);
            }
            if (plansData.length > 0) setSelectedPlanId(plansData[0].id);
        } catch (err) {
            setError("Không thể lấy danh sách gói. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (plans.length > 0) {
            const plan = plans.find(p => isYearly ? p.durationDays > 30 : p.durationDays <= 30);
            if (plan) setSelectedPlanId(plan.id);
            else setSelectedPlanId(plans[0].id);
        }
    }, [isYearly, plans]);

    const handleBuyPlan = async () => {
        if (!selectedPlanId) return;

        try {
            setIsProcessing(true);
            setError(null);
            const data = await subscriptionService.createPaymentUrl(selectedPlanId, 'SEPAY');
            setPaymentData(data);
            setPaymentStatus("PENDING");
            startPolling(data.orderCode);
        } catch (err) {
            setIsProcessing(false);
            setError("Đã xảy ra lỗi khi tạo mã thanh toán.");
        }
    };

    const startPolling = (orderCode) => {
        stopPolling();
        pollingIntervalRef.current = setInterval(async () => {
            try {
                const response = await subscriptionService.checkPaymentStatus(orderCode);
                if (response.status === "SUCCESS") {
                    setPaymentStatus("SUCCESS");
                    stopPolling();
                    if (onUpgradeSuccess) onUpgradeSuccess();
                } else if (response.status === "FAILED" || response.status === "CANCELLED") {
                    setPaymentStatus("FAILED");
                    stopPolling();
                }
            } catch (e) {

            }
        }, 3000); // Poll every 3 seconds
    };

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
            <div
                className="relative bg-black/90 text-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-6 sm:p-10 !py-12 shadow-2xl border border-white/10"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute right-5 top-5 text-white/60 hover:text-white text-xl cursor-pointer bg-transparent border-none"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex flex-col flex-1 hide-scrollbar">
                    {paymentStatus === "SUCCESS" ? (
                        <div className="text-center py-10 space-y-6">
                            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-4 border-green-500/50">
                                <CheckCircle2 className="w-12 h-12 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-2">Thanh toán thành công!</h3>
                                <p className="text-gray-400 text-lg">Chào mừng bạn đến với MindGard Plus.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Trải nghiệm ngay
                            </button>
                        </div>
                    ) : paymentData ? (
                        <div className="flex flex-col md:flex-row gap-8 items-center justify-center py-4">
                            {/* QR Scan Section */}
                            <div className="bg-white p-4 rounded-2xl shadow-xl">
                                <img
                                    src={paymentData.qrUrl}
                                    alt="VietQR Mở App Ngân Hàng"
                                    className="w-64 h-64 object-contain"
                                />
                            </div>

                            <div className="flex-1 space-y-4 text-center md:text-left">
                                <h3 className="text-xl font-bold text-white">Quét mã QR để thanh toán</h3>
                                <div className="bg-gray-800 p-4 rounded-lg space-y-2 text-sm text-gray-300">
                                    <p>Ngân hàng: <strong className="text-white">{paymentData.bankName}</strong></p>
                                    <p>Số tài khoản: <strong className="text-white tracking-widest">{paymentData.bankAccount}</strong></p>
                                    <p>Số tiền: <strong className="text-orange-400 text-lg">{paymentData.amount.toLocaleString()}đ</strong></p>
                                    <p>Nội dung CK: <strong className="text-blue-400 font-mono bg-blue-400/10 px-2 py-1 rounded">{paymentData.orderCode}</strong></p>
                                </div>

                                {paymentStatus === "PENDING" && (
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-amber-500 font-medium">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Đang chờ thanh toán... Hệ thống sẽ tự động xác nhận</span>
                                    </div>
                                )}

                                {paymentStatus === "FAILED" && (
                                    <div className="flex items-center gap-2 text-red-500 font-medium">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>Giao dịch thất bại hoặc đã quá hạn.</span>
                                    </div>
                                )}

                                <button
                                    onClick={resetState}
                                    className="text-gray-400 hover:text-white underline text-sm pt-4"
                                >
                                    Quay lại chọn gói
                                </button>
                            </div>
                        </div>
                    ) : (
                        loading ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                            </div>
                        ) : (
                            <div className="p-0 flex flex-col gap-10">
                                <div className="text-center space-y-2">
                                    <h1 className="text-3xl font-extrabold text-white font-title">
                                        MindGard <span className="italic font-extrabold text-yellow-400">Plus</span>
                                    </h1>
                                    <div className="text-white/50 text-md leading-relaxed mt-2">Mở khóa sức mạnh tập trung tối đa với bộ tính năng AI & Chuyên nghiệp.</div>
                                </div>

                                {error && (
                                    <div className="mx-auto max-w-md p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex justify-center gap-2">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-4 text-center">
                                    <div className="flex justify-center items-center gap-4 text-white/80 text-xs mb-4">
                                        <div className={!isYearly ? "font-bold text-white" : ""}>Monthly</div>
                                        <div className="pt-1">
                                            <label className="relative inline-flex items-center cursor-pointer select-none scale-125">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={isYearly}
                                                    onChange={() => setIsYearly(!isYearly)}
                                                />
                                                <div className="w-8 h-4 bg-gray-500 rounded-full transition peer-checked:bg-blue-500"></div>
                                                <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4"></div>
                                            </label>
                                        </div>
                                        <div className={isYearly ? "font-bold text-white" : ""}>Yearly <span className="text-green-400 font-bold">(save 35%)</span></div>
                                    </div>

                                    <div className="text-left rounded-lg overflow-hidden flex flex-col sm:flex-row justify-center gap-4 mx-auto max-w-3xl">
                                        {/* Free Plan Column */}
                                        <div className="flex flex-col gap-2 py-4 sm:min-w-[200px] opacity-80">
                                            <div className="text-white/80 text-lg font-semibold text-left flex flex-row gap-2 items-center mb-2">
                                                <div>Free</div>
                                                {(!currentSubscription || currentSubscription.status !== 'ACTIVE') && (
                                                    <div className="text-white text-[10px] sm:text-xs bg-white/20 font-light text-left px-1 sm:px-1.5 py-0.5 rounded-lg">Current plan</div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                <div className="h-6 w-6 flex items-center justify-center text-white/50 bg-white/10 rounded-full">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                                <div className="text-sm text-white/70 font-medium">Limited Backgrounds</div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                <div className="h-6 w-6 flex items-center justify-center text-white/50 bg-white/10 rounded-full">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                                <div className="text-sm text-white/70 font-medium">Limited Sounds</div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                <div className="h-6 w-6 flex items-center justify-center text-white/50 bg-white/10 rounded-full">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                                <div className="text-sm text-white/70 font-medium">Basic Analysis</div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                <div className="h-6 w-6 flex items-center justify-center text-white/50 bg-white/10 rounded-full">
                                                    <X className="w-4 h-4 text-white/30" />
                                                </div>
                                                <div className="text-sm text-white/40 font-medium">No Strict Focus</div>
                                            </div>
                                        </div>

                                        {/* Plus Plan Column */}
                                        <div className="space-y-4 sm:min-w-[280px]">
                                            <div className="flex flex-col gap-3 px-5 py-6 border border-white/20 rounded-2xl bg-gradient-to-b from-white/10 to-black shadow-2xl shadow-purple-500/20 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                                                    <Sparkles className="w-16 h-16 text-yellow-400" />
                                                </div>
                                                <div className="text-2xl font-bold text-left italic bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">Plus</div>

                                                <div className="flex items-center gap-3 p-1">
                                                    <div className="h-6 w-6 flex items-center justify-center bg-green-500/20 rounded-full">
                                                        <ImageIcon className="w-4 h-4 text-green-500" />
                                                    </div>
                                                    <div className="text-sm font-medium text-white/90">Unlock all Focus Backgrounds</div>
                                                </div>
                                                <div className="flex items-center gap-3 p-1">
                                                    <div className="h-6 w-6 flex items-center justify-center bg-green-500/20 rounded-full">
                                                        <Bookmark className="w-4 h-4 text-green-500" />
                                                    </div>
                                                    <div className="text-sm font-medium text-white/90">Unlock all Ambience Sounds</div>
                                                </div>
                                                <div className="flex items-center gap-3 p-1">
                                                    <div className="h-6 w-6 flex items-center justify-center bg-green-500/20 rounded-full">
                                                        <ShieldCheck className="w-4 h-4 text-green-500" />
                                                    </div>
                                                    <div className="text-sm font-medium text-white/90">AI Strict Focus Block</div>
                                                </div>
                                                <div className="flex items-center gap-3 p-1">
                                                    <div className="h-6 w-6 flex items-center justify-center bg-green-500/20 rounded-full">
                                                        <BarChart3 className="w-4 h-4 text-green-500" />
                                                    </div>
                                                    <div className="text-sm font-medium text-green-400 font-bold scale-105 transition-transform origin-left">Advanced AI Session Review</div>
                                                </div>
                                                <div className="flex items-center gap-3 p-1">
                                                    <div className="h-6 w-6 flex items-center justify-center bg-green-500/20 rounded-full">
                                                        <FileText className="w-4 h-4 text-green-500" />
                                                    </div>
                                                    <div className="text-sm font-medium text-white/90">Shared Focus Rooms</div>
                                                </div>
                                                <div className="flex items-center gap-3 p-1">
                                                    <div className="h-6 w-6 flex items-center justify-center bg-green-500/20 rounded-full">
                                                        <ThumbsUp className="w-4 h-4 text-green-500" />
                                                    </div>
                                                    <div className="text-sm font-medium text-white/90">Completely Ad-free</div>
                                                </div>
                                                <div className="flex items-center gap-3 p-1">
                                                    <div className="h-6 w-6 flex items-center justify-center bg-green-500/20 rounded-full">
                                                        <Sparkles className="w-4 h-4 text-green-500" />
                                                    </div>
                                                    <div className="text-sm font-medium text-white/90">MindGard Plus User Badge</div>
                                                </div>

                                                <div className="mt-5 space-y-3">
                                                    <div>
                                                        <span className="text-xl font-bold text-white">
                                                            <div className="flex flex-row items-baseline gap-1">
                                                                <span>{plans.find(p => p.id === selectedPlanId)?.price.toLocaleString() || "..."}đ</span>
                                                                <span className="text-gray-400 text-lg ml-0">/{isYearly ? 'year' : 'month'}</span>
                                                            </div>
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={handleBuyPlan}
                                                        disabled={isProcessing || !selectedPlanId}
                                                        className="w-full inline-block bg-white px-4 py-2.5 rounded-xl font-bold text-black hover:bg-gray-200 transition-all text-md cursor-pointer flex justify-center items-center"
                                                    >
                                                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Join plus"}
                                                    </button>

                                                    {currentSubscription?.status === 'ACTIVE' && (
                                                        <p className="text-xs text-center text-amber-400">
                                                            Current: {currentSubscription.planName} (expires {new Date(currentSubscription.endDate).toLocaleDateString('vi-VN')})
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center space-y-4 -mt-2">
                                    <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                                        <ShieldCheck className="w-5 h-5 text-green-400" />
                                        <div>14-day money-back guarantee</div>
                                    </div>
                                    <div className="text-white/80 text-sm">Got question?<a href="mailto:nkiem347@gmail.com" className="font-bold underline ml-1">Email us!</a></div>
                                </div>

                                <div className="relative text-center text-white/90 text-sm sm:text-base rounded-xl p-4 overflow-hidden bg-gradient-to-r from-white/20 via-white/10 to-white/20">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_5s_infinite]"></div>
                                    <span className="relative z-10 flex items-center justify-center flex-wrap gap-2">
                                        👉 Lifetime access just <span className="text-white font-bold">$19.99</span>. Offer ends on <span className="text-white font-bold">Mar 31</span>.
                                        <button className="cursor-pointer bg-white text-black px-4 py-1.5 ml-2 rounded-lg font-bold transition-all shadow-md text-sm sm:text-base hover:bg-gray-200">Get now</button>
                                    </span>
                                </div>

                                <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full mt-4 pb-8">
                                    <h2 className="text-3xl font-extrabold font-title text-white text-center mb-4">FAQ</h2>
                                    <div className="flex flex-col gap-0 border border-white/10 rounded-xl overflow-hidden">
                                        <div className="bg-black/40 px-5 py-4 space-y-1.5 border-b border-white/5">
                                            <div className="text-white font-semibold text-md">Can I use my account on multiple devices?</div>
                                            <div className="text-white/70 text-sm">Yes! Just sign in with the same account on any device.</div>
                                        </div>
                                        <div className="bg-black/40 px-5 py-4 space-y-1.5 border-b border-white/5">
                                            <div className="text-white font-semibold text-md">What payment methods do you accept?</div>
                                            <div className="text-white/70 text-sm">We accept VietQR via SePay for instant bank transfers.</div>
                                        </div>
                                        <div className="bg-black/40 px-5 py-4 space-y-1.5 border-b border-white/5">
                                            <div className="text-white font-semibold text-md">How do I cancel?</div>
                                            <div className="text-white/70 text-sm">Standard plans do not auto-renew. You simply re-subscribe when your time runs out.</div>
                                        </div>
                                        <div className="bg-black/40 px-5 py-4 space-y-1.5 border-b border-white/5">
                                            <div className="text-white font-semibold text-md">Can I switch between plans?</div>
                                            <div className="text-white/70 text-sm">Yes, you can upgrade at any time. Changes and time take effect cumulatively immediately.</div>
                                        </div>
                                        <div className="bg-black/40 px-5 py-4 space-y-1.5 border-b border-white/5">
                                            <div className="text-white font-semibold text-md">Is my data safe?</div>
                                            <div className="text-white/70 text-sm">Absolutely. We use industry-standard encryption to protect your data and never sell it to third parties.</div>
                                        </div>
                                        <div className="bg-black/40 px-5 py-4 space-y-1.5">
                                            <div className="text-white font-semibold text-md">Need help?</div>
                                            <div className="text-white/70 text-sm">Email us at nkiem347@gmail.com or join the MindGard Discord.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
