import { useState, useEffect, useCallback } from 'react';

// Types
export interface MilitaryNode {
  id: string;
  parentId: string | null;
  name: string;
  symbolId: string;
  unitType: string;
  commanderUrl?: string;
  commanderName?: string;
  commanderRank?: string;
  personnel?: {
    total: number;
    officers?: number;
    soldiers?: number;
  };
  equipment?: {
    type: string;
    count: number;
  }[];
  description?: string;
  status?: 'active' | 'reserve' | 'training' | 'combat' | 'deployed' | 'maintenance';
  location?: string;
  affiliation?: 'friend' | 'hostile' | 'neutral' | 'unknown';
  headquarters?: boolean;
  additionalInformation?: string;
  higherFormation?: string;
}

export interface SelectedCountry {
  code: string;
  name: string;
}

export interface SavedChart {
  id: string;
  name: string;
  description?: string;
  countryCode: string;
  countryName: string;
  nodes: MilitaryNode[];
  createdAt: string;
  updatedAt: string;
}

// Chart settings type
export interface ChartSettings {
  symbolSize: number;
  fontSize: number;
  fontColor: string;
  lineColor: string;
  lineWidth: number;
  levelPadding: number;
  unitPadding: number;
  useShortNames: boolean;
  showPersonnelCount: boolean;
  showUnitStatus: boolean;
  showCommanderInfo: boolean;
  showEchelonSymbols: boolean;
  showUnitNames: boolean;
  standard: string;
  defaultUnitType: string;
  useLegacySymbols: boolean;
}

// Default settings
export const defaultChartSettings: ChartSettings = {
  symbolSize: 40,
  fontSize: 12,
  fontColor: '#000000',
  lineColor: '#666666',
  lineWidth: 1,
  levelPadding: 160,
  unitPadding: 240,
  useShortNames: false,
  showPersonnelCount: true,
  showUnitStatus: true,
  showCommanderInfo: true,
  showEchelonSymbols: true,
  showUnitNames: true,
  standard: 'app6d',
  defaultUnitType: '111100',
  useLegacySymbols: false,
};

/**
 * Custom hook برای مدیریت داده‌های نمودار سازمانی
 */
export const useChartData = () => {
  // State management
  const [selectedCountry, setSelectedCountry] = useState<SelectedCountry | null>(null);
  const [countryNodes, setCountryNodes] = useState<Record<string, MilitaryNode[]>>({});
  const [nodes, setNodes] = useState<MilitaryNode[]>([]);
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [chartSettings, setChartSettings] = useState<ChartSettings>({ ...defaultChartSettings });

  // Load saved charts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedCharts');
      if (saved) {
        setSavedCharts(JSON.parse(saved));
      }
    } catch (error) {
      console.error('خطا در بارگذاری نمودارهای ذخیره شده:', error);
    }
  }, []);

  // Save charts to localStorage
  useEffect(() => {
    if (savedCharts.length > 0) {
      localStorage.setItem('savedCharts', JSON.stringify(savedCharts));
    }
  }, [savedCharts]);

  // Handle country selection
  const handleSelectCountry = useCallback((country: { code: string; name: string }) => {
    setSelectedCountry({ code: country.code, name: country.name });
    setNodes(countryNodes[country.code] ?? []);
  }, [countryNodes]);

  // Add or update node
  const saveNode = useCallback((node: MilitaryNode) => {
    if (!selectedCountry) return;

    setNodes((prev) => {
      const exists = prev.find((p) => p.id === node.id);
      const newNodes = exists 
        ? prev.map((p) => (p.id === node.id ? node : p)) 
        : [...prev, node];
      
      // Update country nodes mapping
      setCountryNodes((map) => ({ ...map, [selectedCountry.code]: newNodes }));
      return newNodes;
    });
  }, [selectedCountry]);

  // Delete node and its children
  const deleteNode = useCallback((id: string) => {
    if (!selectedCountry) return;

    setNodes((prev) => {
      const deleteRecursive = (nodeId: string, nodes: MilitaryNode[]): MilitaryNode[] => {
        // Find children of the node to delete
        const children = nodes.filter(n => n.parentId === nodeId);
        let result = nodes.filter(n => n.id !== nodeId);
        
        // Recursively delete children
        children.forEach(child => {
          result = deleteRecursive(child.id, result);
        });
        
        return result;
      };

      const filtered = deleteRecursive(id, prev);
      setCountryNodes((map) => ({ ...map, [selectedCountry.code]: filtered }));
      return filtered;
    });
  }, [selectedCountry]);

  // Save chart
  const saveChart = useCallback((name: string, description?: string) => {
    if (!selectedCountry || !name.trim()) return;
    
    const now = new Date().toISOString();
    const newChart: SavedChart = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description?.trim() || undefined,
      countryCode: selectedCountry.code,
      countryName: selectedCountry.name,
      nodes,
      createdAt: now,
      updatedAt: now,
    };
    
    setSavedCharts(prev => [...prev, newChart]);
    return newChart;
  }, [selectedCountry, nodes]);

  // Load chart
  const loadChart = useCallback((chart: SavedChart) => {
    setSelectedCountry({
      code: chart.countryCode,
      name: chart.countryName,
    });
    setNodes(chart.nodes);
    setCountryNodes(prev => ({
      ...prev,
      [chart.countryCode]: chart.nodes,
    }));
  }, []);

  // Delete saved chart
  const deleteChart = useCallback((chartId: string) => {
    setSavedCharts(prev => prev.filter(c => c.id !== chartId));
  }, []);

  // Export chart to JSON
  const exportChart = useCallback(() => {
    if (!selectedCountry || nodes.length === 0) return null;
    
    const chartData = {
      countryCode: selectedCountry.code,
      countryName: selectedCountry.name,
      nodes,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(chartData, null, 2);
  }, [selectedCountry, nodes]);

  // Import chart from JSON
  const importChart = useCallback((jsonData: string) => {
    try {
      const chartData = JSON.parse(jsonData);
      
      if (!chartData.countryCode || !chartData.countryName || !Array.isArray(chartData.nodes)) {
        throw new Error('فرمت فایل نامعتبر است');
      }
      
      setSelectedCountry({
        code: chartData.countryCode,
        name: chartData.countryName
      });
      
      setNodes(chartData.nodes);
      setCountryNodes(prev => ({
        ...prev,
        [chartData.countryCode]: chartData.nodes
      }));
      
      return true;
    } catch (error) {
      console.error('خطا در وارد کردن ساختار:', error);
      throw error;
    }
  }, []);

  // Update chart settings
  const updateChartSettings = useCallback((key: keyof ChartSettings, value: any) => {
    setChartSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Reset chart settings to defaults
  const resetChartSettings = useCallback(() => {
    setChartSettings({ ...defaultChartSettings });
  }, []);

  // Get node by ID
  const getNodeById = useCallback((id: string): MilitaryNode | undefined => {
    return nodes.find(node => node.id === id);
  }, [nodes]);

  // Get children of a node
  const getNodeChildren = useCallback((parentId: string | null): MilitaryNode[] => {
    return nodes.filter(node => node.parentId === parentId);
  }, [nodes]);

  // Get node path (from root to node)
  const getNodePath = useCallback((nodeId: string): MilitaryNode[] => {
    const path: MilitaryNode[] = [];
    let currentNode = getNodeById(nodeId);
    
    while (currentNode) {
      path.unshift(currentNode);
      currentNode = currentNode.parentId ? getNodeById(currentNode.parentId) : undefined;
    }
    
    return path;
  }, [getNodeById]);

  // Validate node (check for circular references)
  const validateNode = useCallback((node: MilitaryNode): string | null => {
    if (!node.name.trim()) {
      return 'نام یگان الزامی است';
    }
    
    if (node.parentId) {
      const path = getNodePath(node.parentId);
      if (path.some(p => p.id === node.id)) {
        return 'والد انتخاب شده باعث ایجاد حلقه می‌شود';
      }
    }
    
    return null;
  }, [getNodePath]);

  return {
    // State
    selectedCountry,
    countryNodes,
    nodes,
    savedCharts,
    chartSettings,
    
    // Actions
    handleSelectCountry,
    saveNode,
    deleteNode,
    saveChart,
    loadChart,
    deleteChart,
    exportChart,
    importChart,
    updateChartSettings,
    resetChartSettings,
    
    // Helpers
    getNodeById,
    getNodeChildren,
    getNodePath,
    validateNode,
    
    // Setters (for advanced use cases)
    setSelectedCountry,
    setNodes,
    setCountryNodes,
    setSavedCharts,
    setChartSettings,
  };
}; 