import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { CheckoutDetailsResult } from "../data/checkout.schemas";
import { useOrderPolling } from "../hooks/use-order-polling";
import { usePixCheckout } from "../hooks/use-pix-checkout";
import {
  AiCreationGuaranteedBanner,
  DevPaymentSimulatorCard,
  CheckoutPaidSuccessCard,
  CheckoutHeader,
  ResponsiveCheckoutLayout,
} from "../components";
import { trackInitiateCheckout } from "@/lib/tracking";

export interface CheckoutViewProps {
  initialDetails: CheckoutDetailsResult;
  onNavigateToDelivery?: (orderId: string) => void;
  onNavigateBack?: () => void;
}

export function CheckoutView({
  initialDetails,
  onNavigateToDelivery,
  onNavigateBack,
}: CheckoutViewProps) {
  const [details, setDetails] = useState<CheckoutDetailsResult>(initialDetails);
  const [isSuccessPaid, setIsSuccessPaid] = useState(
    initialDetails.status === "PAID",
  );

  useEffect(() => {
    if (details.orderId && details.amountCents) {
      trackInitiateCheckout(details.orderId, details.amountCents);
    }
  }, [details.orderId, details.amountCents]);

  let navigateHook: ReturnType<typeof useNavigate> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigateHook = useNavigate();
  } catch {
    navigateHook = null;
  }

  const handleDeliveryNavigation = (orderId: string) => {
    setIsSuccessPaid(true);
    setTimeout(() => {
      if (onNavigateToDelivery) {
        onNavigateToDelivery(orderId);
      } else if (navigateHook) {
        navigateHook({
          href: `/pedido/${orderId}`,
        });
      } else if (typeof window !== "undefined") {
        window.location.href = `/pedido/${orderId}`;
      }
    }, 1200);
  };

  const { isPaid, status, refetch, isFetching } = useOrderPolling({
    orderId: details.orderId,
    initialStatus: details.status,
    onPaymentConfirmed: () => {
      handleDeliveryNavigation(details.orderId);
    },
  });

  const {
    copyPixCode,
    isCopied,
    updateWhatsapp,
    isUpdatingWhatsapp,
    regenerateCharge,
    isRegenerating,
    simulatePayment,
    isSimulatingPayment,
    simulatePaymentError,
    toggleCobranding,
    isUpdatingCobranding,
  } = usePixCheckout({
    orderId: details.orderId,
    onCobrandingSuccess: (updated) => {
      setDetails(updated);
    },
  });

  const handleToggleCobranding = async (accepted: boolean) => {
    try {
      const updated = await toggleCobranding(accepted);
      if (updated) {
        setDetails(updated);
      }
    } catch {
      // Falha tratada pelo hook com rollback e toast
    }
  };

  const handleSimulatePayment = async () => {
    try {
      const result = await simulatePayment();
      if (result?.success) {
        handleDeliveryNavigation(details.orderId);
      }
    } catch {
      // Falha tratada pelo hook
    }
  };

  const handleRegenerate = async () => {
    try {
      const refreshed = await regenerateCharge();
      if (refreshed) {
        setDetails(refreshed);
      }
    } catch {
      // Falha tratada pelo hook
    }
  };

  const handleCheckNow = () => {
    refetch();
  };

  const previewCardImageUrl =
    (details.frozenSnapshot as { previewCardImageUrl?: string })
      ?.previewCardImageUrl || null;
  const initialWhatsapp =
    details.customerWhatsapp ||
    (details.frozenSnapshot as { whatsapp?: string })?.whatsapp ||
    null;

  if (isPaid || isSuccessPaid) {
    return <CheckoutPaidSuccessCard />;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 pb-24 sm:gap-6 sm:py-8 lg:pb-8">
      <CheckoutHeader onNavigateBack={onNavigateBack} />

      {/* Banner Informativo quando a arte será gerada por IA pós-Pix */}
      {!previewCardImageUrl && <AiCreationGuaranteedBanner />}

      {/* Modo de Desenvolvimento: Simulação de Pagamento Pix */}
      {details.isDevMode && !isPaid && !isSuccessPaid && (
        <DevPaymentSimulatorCard
          onSimulatePayment={handleSimulatePayment}
          isSimulating={isSimulatingPayment}
          error={simulatePaymentError}
        />
      )}

      {/* Layout Responsivo Completo (Mobile + Desktop) */}
      <ResponsiveCheckoutLayout
        details={details}
        status={status}
        isCopied={isCopied}
        isFetching={isFetching}
        isRegenerating={isRegenerating}
        isUpdatingCobranding={isUpdatingCobranding}
        isUpdatingWhatsapp={isUpdatingWhatsapp}
        initialWhatsapp={initialWhatsapp}
        onCopyPix={copyPixCode}
        onCheckNow={handleCheckNow}
        onRegenerateCharge={handleRegenerate}
        onSaveWhatsapp={updateWhatsapp}
        onToggleCobranding={handleToggleCobranding}
      />
    </div>
  );
}
