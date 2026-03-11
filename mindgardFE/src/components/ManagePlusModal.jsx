import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CalendarClock, ShieldCheck, Sparkles, Loader2, Clock, Crown } from "lucide-react";
import { subscriptionService } from "../services/subscriptionService";
import { authService } from "../services/authService";

export default function ManagePlusModal({ isOpen, onClose }) {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isManualPlus, setIsManualPlus] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSubscription();
        }
    }, [isOpen]);

    const fetchSubscription = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await subscriptionService.getCurrentSubscription();
            if (data) {
                // Sometimes the API returns { data: {...} } or just the object
                const subData = data.data || data;
                setSubscription(subData);
                setIsManualPlus(false);
            } else {
                setSubscription(null);
                // Check if user has manual ROLE_PLUS
                const authUser = authService.getCachedAuth()?.user;
                setIsManualPlus(authUser?.roles?.includes('ROLE_PLUS') || false);
            }
        } catch (err) {
            setError("Không thể tải thông tin gói cước.");
        } finally {
            setLoading(false);
        }
    };

    const handleExtend = () => {
        onClose();
        window.dispatchEvent(new CustomEvent('mindgard_open_subscription'));
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-md bg-black/50">
            <div
                className="relative bg-[#1A1A1A] text-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-white/10"
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
                    <Sparkles className="w-24 h-24 text-yellow-500" />
                </div>

                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-white/60 hover:text-white transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Crown className="w-6 h-6 text-amber-500" />
                    Gói cước của bạn
                </h2>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    </div>
                ) : error ? (
                    <div className="text-red-400 text-sm text-center py-4">{error}</div>
                ) : subscription ? (
                    <div className="space-y-6 relative z-10">
                        <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1">{subscription.planName || "MindGard Plus"}</h3>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/20">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        Đang hoạt động
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mt-5 border-t border-white/10 pt-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/60">Ngày đăng ký</span>
                                    <span className="font-medium">{new Date(subscription.startDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/60">Ngày kết thúc</span>
                                    <span className="font-medium text-amber-400">{new Date(subscription.endDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/60">Trạng thái gia hạn</span>
                                    <span className="font-medium">Thủ công</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4">
                            <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                Chu kỳ thanh toán tiếp theo
                            </h4>
                            <p className="text-xs text-white/60 leading-relaxed mb-4">
                                Gói cước của bạn sẽ hết hạn vào <strong>{new Date(subscription.endDate).toLocaleDateString('vi-VN')}</strong>. Bạn có thể gia hạn sớm để cộng dồn thêm thời gian sử dụng mà không bị gián đoạn trải nghiệm.
                            </p>

                            <button
                                onClick={handleExtend}
                                className="w-full bg-white text-black font-bold py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                                Gia hạn gói cước
                            </button>
                        </div>
                    </div>
                ) : isManualPlus ? (
                    <div className="space-y-6 relative z-10">
                        <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1">MindGard Plus</h3>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/20">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        Đang hoạt động
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mt-5 border-t border-white/10 pt-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/60">Gói cước</span>
                                    <span className="font-medium text-amber-400">Kích hoạt đặc quyền</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/60">Ngày kết thúc</span>
                                    <span className="font-medium">Vĩnh viễn</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 text-center">
                            <Sparkles className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                            <p className="text-sm text-white/80 leading-relaxed mb-1">
                                Tài khoản của bạn đã được quản trị viên cấp quyền truy cập toàn bộ tính năng cao cấp của MindGard Plus.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <CalendarClock className="w-8 h-8 text-white/30" />
                        </div>
                        <div>
                            <p className="text-white font-medium">Bạn chưa đăng ký gói Plus nào</p>
                            <p className="text-xs text-white/50 mt-1">Nâng cấp để mở khóa mọi tính năng.</p>
                        </div>
                        <button
                            onClick={handleExtend}
                            className="mt-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-2 rounded-lg"
                        >
                            Nâng cấp ngay
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
