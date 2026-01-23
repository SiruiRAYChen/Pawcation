import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  onCancel?: () => void;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
}

export function ConfirmationDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  cancelText = "Cancel",
  confirmText = "OK",
  onCancel,
  onConfirm,
  variant = 'default'
}: ConfirmationDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
    onCancel?.();
  };

  const handleConfirm = () => {
    onOpenChange(false);
    onConfirm();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm mx-4 rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-center">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-gray-600 mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-3 mt-6">
          <AlertDialogCancel 
            onClick={handleCancel}
            className="flex-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className={`flex-1 rounded-full ${
              variant === 'destructive' 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            } text-white`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}