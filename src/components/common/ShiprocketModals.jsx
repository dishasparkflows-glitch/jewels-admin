import React, { useState, useEffect } from 'react';
import {
  HiOutlineX,
  HiOutlineTruck,
  HiOutlineCheck,
  HiOutlineLocationMarker,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { logisticsAPI } from '../../api/services';

/**
 * Shiprocket Forward Dispatch Modal
 */
export function ShiprocketDispatchModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}) {
  const [loadingRates, setLoadingRates] = useState(false);
  const [couriers, setCouriers] = useState([]);
  const [selectedCourierId, setSelectedCourierId] = useState(null);
  const [selectedCourierName, setSelectedCourierName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packageSpecs, setPackageSpecs] = useState({
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5,
  });

  useEffect(() => {
    if (isOpen && order?._id) {
      setLoadingRates(true);
      logisticsAPI
        .getCourierRates(order._id)
        .then((res) => {
          const list = res?.data?.data?.availableCouriers || res?.data?.availableCouriers || [];
          setCouriers(list);
          if (list.length > 0) {
            setSelectedCourierId(list[0].courierId);
            setSelectedCourierName(list[0].courierName);
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch courier rates:', err.message);
          toast.error('Unable to fetch live courier rates. Default couriers will be used.');
        })
        .finally(() => setLoadingRates(false));
    }
  }, [isOpen, order?._id]);

  if (!isOpen || !order) return null;

  const handleDispatch = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        courierId: selectedCourierId,
        courierName: selectedCourierName,
        length: Number(packageSpecs.length) || 10,
        breadth: Number(packageSpecs.breadth) || 10,
        height: Number(packageSpecs.height) || 10,
        weight: Number(packageSpecs.weight) || 0.5,
      };

      const res = await logisticsAPI.createShipment(order._id, payload);
      toast.success(res?.data?.message || 'Shipment & AWB allocated successfully!');
      if (onSuccess) onSuccess(res?.data?.data?.shiprocketInfo || res?.data?.shiprocketInfo);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to dispatch shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deliveryCity = order.shippingAddress?.city || 'Destination';
  const deliveryPincode = order.shippingAddress?.postalCode || order.shippingAddress?.pincode || '';
  const isCod = order.payment?.method === 'cod';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-stone-200 animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#201e1b] to-[#3a352f] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8b6f4e] flex items-center justify-center text-white shadow-xs">
              <HiOutlineTruck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Shiprocket Dispatch</span>
                <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-white/20 text-[#faf5ee]">v2 API</span>
              </h3>
              <p className="text-[11px] text-stone-300">
                Order {order.orderNumber} · {deliveryCity} ({deliveryPincode})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Order Snapshot */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Recipient</span>
              <span className="font-semibold text-stone-800 text-xs">
                {order.shippingAddress?.fullName || order.customer?.firstName || 'Customer'}
              </span>
              <span className="text-stone-500 text-[11px] block">
                {order.shippingAddress?.phone || order.customer?.phone}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Payment Mode</span>
              <span className="font-bold text-xs capitalize text-stone-900">
                {isCod ? 'Cash on Delivery (Partial COD)' : 'Prepaid (Online)'}
              </span>
              <span className="text-[11px] font-bold text-[#8b6f4e] block">
                ₹{Number(order.pricing?.total || order.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Package Dimensions */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-800 block text-xs">
              Package Specifications
            </label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <span className="text-[10px] text-stone-500 block mb-0.5">Length (cm)</span>
                <input
                  type="number"
                  value={packageSpecs.length}
                  onChange={(e) => setPackageSpecs({ ...packageSpecs, length: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block mb-0.5">Breadth (cm)</span>
                <input
                  type="number"
                  value={packageSpecs.breadth}
                  onChange={(e) => setPackageSpecs({ ...packageSpecs, breadth: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block mb-0.5">Height (cm)</span>
                <input
                  type="number"
                  value={packageSpecs.height}
                  onChange={(e) => setPackageSpecs({ ...packageSpecs, height: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block mb-0.5">Weight (kg)</span>
                <input
                  type="number"
                  step="0.1"
                  value={packageSpecs.weight}
                  onChange={(e) => setPackageSpecs({ ...packageSpecs, weight: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Courier Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-800 block text-xs">
                Select Courier Partner ({couriers.length} Serviceable)
              </label>
              {loadingRates && (
                <span className="text-[11px] text-[#8b6f4e] font-medium animate-pulse">
                  Fetching live rates...
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {couriers.map((c) => {
                const isSelected = selectedCourierId === c.courierId;
                return (
                  <div
                    key={c.courierId}
                    onClick={() => {
                      setSelectedCourierId(c.courierId);
                      setSelectedCourierName(c.courierName);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#8b6f4e] bg-[#faf6f0] ring-1 ring-[#8b6f4e]'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-[#8b6f4e] bg-[#8b6f4e] text-white'
                            : 'border-stone-300'
                        }`}
                      >
                        {isSelected && <HiOutlineCheck className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="font-bold text-stone-900 text-xs block">
                          {c.courierName}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-stone-500">
                          <span>★ {c.rating || 4.5}</span>
                          <span>·</span>
                          <span>Est. Delivery: {c.etd}</span>
                          {c.isAir && (
                            <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-semibold">
                              AIR
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-stone-900 block">
                        ₹{c.rate}
                      </span>
                      <span className="text-[10px] text-stone-400">Freight Charge</span>
                    </div>
                  </div>
                );
              })}

              {!loadingRates && couriers.length === 0 && (
                <div className="p-4 rounded-xl bg-stone-50 text-center text-stone-500 text-xs">
                  Standard Shiprocket multi-carrier auto-allocation will be used.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDispatch}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Allocating AWB...</span>
              </>
            ) : (
              <>
                <HiOutlineTruck className="w-4 h-4" />
                <span>Confirm &amp; Allocate AWB</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Shiprocket Live Tracking Modal
 */
export function ShiprocketTrackingModal({
  isOpen,
  onClose,
  orderId,
  awbCode,
}) {
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(null);

  useEffect(() => {
    if (isOpen && (orderId || awbCode)) {
      setLoading(true);
      const request = orderId
        ? logisticsAPI.trackOrder(orderId)
        : logisticsAPI.trackOrder(awbCode);

      request
        .then((res) => {
          setTracking(res?.data?.data || res?.data);
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || err.message || 'Tracking details unavailable');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, orderId, awbCode]);

  if (!isOpen) return null;

  const scans = tracking?.scans || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-stone-200 animate-scale-in">
        <div className="bg-gradient-to-r from-[#201e1b] to-[#3a352f] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8b6f4e] flex items-center justify-center text-white">
              <HiOutlineLocationMarker className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Live Shipment Tracking
              </h3>
              <p className="text-[11px] text-stone-300 font-mono">
                AWB: {tracking?.awb || awbCode || 'Pending'} · {tracking?.courierName || 'Carrier'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-7 h-7 border-2 border-stone-300 border-t-[#8b6f4e] rounded-full animate-spin mx-auto" />
              <p className="text-stone-500 font-medium">Fetching real-time scans from courier hub...</p>
            </div>
          ) : tracking ? (
            <>
              {/* Current Status Badge Card */}
              <div className="p-4 rounded-xl bg-[#faf6f0] border border-[#8b6f4e]/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Current Status</span>
                  <span className="font-bold text-sm text-stone-900 block mt-0.5">
                    {tracking.currentStatus || 'IN TRANSIT'}
                  </span>
                  {tracking.etd && (
                    <span className="text-[11px] text-[#8b6f4e] font-medium block mt-0.5">
                      Estimated Delivery: {tracking.etd}
                    </span>
                  )}
                </div>
                <div className="text-right text-[11px] text-stone-500">
                  <span className="block font-medium">{tracking.origin || 'Warehouse'}</span>
                  <span className="block font-bold text-stone-800">➔ {tracking.destination || 'Customer'}</span>
                </div>
              </div>

              {/* Transit Timeline Scans */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-2">
                  Transit Milestones &amp; Hub Scans
                </span>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                  {scans.length > 0 ? (
                    scans.map((scan, i) => (
                      <div key={i} className="relative">
                        <div
                          className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                            i === 0
                              ? 'bg-[#8b6f4e] border-white ring-2 ring-[#8b6f4e]'
                              : 'bg-stone-300 border-white'
                          }`}
                        />
                        <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/80 space-y-0.5">
                          <p className="font-semibold text-stone-900 text-xs">
                            {scan.activity}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-stone-500">
                            <span>{scan.location || 'Transit Hub'}</span>
                            <span>{new Date(scan.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-stone-500 text-xs">
                      Shipment is awaiting first carrier hub scan.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-stone-500">
              No tracking information available yet.
            </div>
          )}
        </div>

        <div className="p-3 bg-stone-50 border-t border-stone-200 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
