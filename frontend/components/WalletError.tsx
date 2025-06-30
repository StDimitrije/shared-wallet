
import { useWalletProvider } from "../hooks/useWalletProvider";

export const WalletError = () => {
  const { errorMessage, clearError } = useWalletProvider();
  const isError = !!errorMessage

  return (
    <div
      style={isError ? { backgroundColor: "brown" } : {}}
    >
      {isError && (
        <p className="text-white" onClick={clearError}>
          <strong >Error:</strong> {errorMessage}
        </p>
      )}
    </div>
  )
}