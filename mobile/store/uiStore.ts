import { create } from 'zustand';

interface UiState {
  isUpgradeModalVisible: boolean;
  upgradeModalFeature: string | null;

  showUpgradeModal: (feature: string) => void;
  hideUpgradeModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isUpgradeModalVisible: false,
  upgradeModalFeature: null,

  showUpgradeModal: (feature) =>
    set({ isUpgradeModalVisible: true, upgradeModalFeature: feature }),

  hideUpgradeModal: () =>
    set({ isUpgradeModalVisible: false, upgradeModalFeature: null }),
}));
