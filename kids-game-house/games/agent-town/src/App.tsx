import { Suspense, lazy } from 'react';
import { StudioProvider } from "@/lib/store";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GameErrorBoundary } from "@/components/game/GameErrorBoundary";
import TerminalModal from "@/components/panel/TerminalModal";
import WorkerSessionHistoryModal from "@/components/panel/WorkerSessionHistoryModal";
import GameHud from "@/components/hud/GameHud";

const PhaserGame = lazy(() => import("@/components/game/PhaserGame"));

export default function App() {
  return (
    <ErrorBoundary>
      <StudioProvider>
        <main
          className="relative w-screen h-screen overflow-hidden"
          style={{ background: "var(--pixel-bg)" }}
        >
          {/* Game canvas — full screen background */}
          <div className="absolute inset-0">
            <GameErrorBoundary>
              <Suspense fallback={<div>Loading game...</div>}>
                <PhaserGame />
              </Suspense>
            </GameErrorBoundary>
          </div>
          {/* HUD overlay — floating UI on top */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
            <GameHud />
          </div>
          <TerminalModal />
          <WorkerSessionHistoryModal />
        </main>
      </StudioProvider>
    </ErrorBoundary>
  );
}