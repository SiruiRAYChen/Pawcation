import { api } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MemoItem {
  item: string;
  checked: boolean;
}

interface PetPackingMemoProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  memoItems: MemoItem[];
}

export function PetPackingMemo({ isOpen, onClose, planId, memoItems: initialMemoItems }: PetPackingMemoProps) {
  const [memoItems, setMemoItems] = useState<MemoItem[]>(initialMemoItems);
  const queryClient = useQueryClient();

  // Update local state when props change
  useEffect(() => {
    setMemoItems(initialMemoItems);
  }, [initialMemoItems]);

  // Mutation to save memo items to backend
  const saveMemoMutation = useMutation({
    mutationFn: async (items: MemoItem[]) => {
      return await api.updateMemoItems(planId, items);
    },
    onSuccess: () => {
      // Invalidate plan queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: (error) => {
      console.error('Error saving memo items:', error);
    },
  });

  const toggleItem = (index: number) => {
    const newItems = [...memoItems];
    newItems[index].checked = !newItems[index].checked;
    setMemoItems(newItems);
    
    // Save to backend
    saveMemoMutation.mutate(newItems);
  };

  const checkedCount = memoItems.filter(item => item.checked).length;
  const totalCount = memoItems.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full h-full sm:h-auto sm:max-h-[80vh] sm:max-w-md bg-white sm:rounded-2xl rounded-none shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">🐾 Pet Packing List</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Don't forget these essentials for your furry friend!
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold text-orange-600">
                    {checkedCount} of {totalCount} packed
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6">
              {memoItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No packing items yet.</p>
                  <p className="text-sm mt-2">Generate a travel plan to see recommendations!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memoItems.map((item, index) => (
                    <motion.button
                      key={index}
                      onClick={() => toggleItem(index)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        item.checked
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                            item.checked
                              ? 'bg-orange-500 border-orange-500'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {item.checked && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            >
                              <Check className="w-4 h-4 text-white" strokeWidth={3} />
                            </motion.div>
                          )}
                        </div>

                        {/* Item text */}
                        <span
                          className={`flex-1 transition-all ${
                            item.checked
                              ? 'line-through text-gray-500'
                              : 'text-gray-900'
                          }`}
                        >
                          {item.item}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {totalCount > 0 && checkedCount === totalCount && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border-t border-gray-200 bg-gradient-to-br from-orange-50 to-orange-100"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="font-semibold text-orange-900">All packed and ready to go!</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Have a pawsome trip with your furry companion!
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
