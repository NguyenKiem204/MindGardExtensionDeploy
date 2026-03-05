import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, ShieldCheck, Loader2, Sparkles, AlertCircle, CalendarClock } from "lucide-react";
import { subscriptionService } from "../services/subscriptionService";
import { authService } from "../services/authService";

export default function SubscriptionModal({ isOpen, onClose, onUpgradeSuccess }) {
    const [plans, setPlans] = useState([]);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPlanId, setSelectedPlanId] = useState(null);

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
                console.error("Polling error", e);
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
                className="relative w-full max-w-2xl bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Ribbon */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-8 h-8 text-amber-200" />
                            MindGard Plus
                        </h2>
                        <p className="text-orange-100 mt-2 font-medium">
                            Mở khóa sức mạnh tập trung tối đa với bộ tính năng AI & Chuyên nghiệp
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 md:p-8">
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
                        <>
                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex gap-2">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex justify-center items-center py-20">
                                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-8 mb-4">
                                    {/* Features List */}
                                    <div className="space-y-6">
                                        {currentSubscription ? (
                                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 shadow-lg">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-amber-500/20 rounded-lg">
                                                        <CalendarClock className="w-6 h-6 text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white text-lg">Gói hiện tại</h3>
                                                        <p className="text-amber-400 font-medium">
                                                            {currentSubscription.planName || "MindGard Plus"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-amber-500/20 text-gray-300 text-sm flex justify-between items-center">
                                                    <span>Ngày hết hạn:</span>
                                                    <span className="font-bold text-white">
                                                        {new Date(currentSubscription.endDate).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                                <div className="mt-2 text-xs text-amber-200/80 italic">
                                                    (Bạn có thể mua thêm để gia hạn thời gian hiện tại)
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <h3 className="font-semibold text-xl text-white mb-4">Đặc quyền Plus</h3>
                                                <div className="space-y-3.5">
                                                    {[
                                                        "Mở khóa tất cả Hình nền & Âm thanh",
                                                        "Chế độ chặn xao nhãng bằng AI (Strict Focus)",
                                                        "Phòng học chung (Shared Focus Rooms)",
                                                        "Phân tích hiệu suất học tập nâng cao",
                                                        "Trải nghiệm hoàn toàn không quảng cáo"
                                                    ].map((feat, i) => (
                                                        <div key={i} className="flex gap-3 text-gray-300 items-start">
                                                            <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                                            <span className="text-sm leading-relaxed">{feat}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-4 bg-slate-800/80 rounded-xl flex items-start gap-3 border border-slate-700/50">
                                            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-green-400 mt-0.5" />
                                            <div className="text-gray-300 text-xs leading-relaxed space-y-1">
                                                <p>Thanh toán an toàn, tự động kích hoạt ngay lập tức qua <strong className="text-white">VietQR SePay</strong>.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Plans Selection */}
                                    <div className="flex flex-col h-full">
                                        <div className="space-y-4 mb-6">
                                            {plans.map((plan) => (
                                                <label
                                                    key={plan.id}
                                                    onClick={() => setSelectedPlanId(plan.id)}
                                                    className={`relative cursor-pointer border-2 rounded-2xl p-5 block transition-all ${selectedPlanId === plan.id
                                                        ? "border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.15)] ring-1 ring-orange-500 overflow-hidden"
                                                        : "border-gray-700 bg-gray-800/40 hover:bg-gray-800/80 overflow-hidden"
                                                        }`}
                                                >
                                                    <div className="absolute top-5 right-5">
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPlanId === plan.id ? 'border-orange-500 bg-orange-500' : 'border-gray-500'}`}>
                                                            {selectedPlanId === plan.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                                        </div>
                                                    </div>

                                                    {plan.durationDays > 30 && (
                                                        <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                                                            Tiết kiệm nhất
                                                        </div>
                                                    )}
                                                    <div className="pr-8">
                                                        <h4 className={`font-semibold text-lg mb-2 ${selectedPlanId === plan.id ? 'text-orange-100' : 'text-gray-300'}`}>
                                                            {plan.durationDays > 30 ? 'Gói 1 Năm' : 'Gói 1 Tháng'}
                                                        </h4>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-3xl font-black text-white">{plan.price.toLocaleString()}</span>
                                                            <span className="text-xl font-bold text-white">₫</span>
                                                            <span className="text-gray-500 ml-1 text-sm">/ {plan.durationDays > 30 ? 'năm' : 'tháng'}</span>
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>

                                        <button
                                            onClick={handleBuyPlan}
                                            disabled={isProcessing || !selectedPlanId}
                                            className="w-full mt-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-500 text-white font-bold py-4 rounded-xl flex justify-center items-center shadow-lg shadow-orange-500/20 transform transition disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                "Nâng cấp ngay"
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
