import Dashboard from "../../components/Dashboard";
import { WalletProvider } from "../../hooks/WalletProvider";

export default function Home() {
  return (
    <WalletProvider>
      <Dashboard></Dashboard>
    </WalletProvider>
  );
}
