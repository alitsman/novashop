import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  clearProductsDeleteError,
  deleteProduct,
  selectProductsDeleteError,
} from "../../../features/products/productsSlice";

type UseAdminProductDeleteParams = {
  productId: string;
  onDeleted: () => void;
};

export function useAdminProductDelete({
  productId,
  onDeleted,
}: UseAdminProductDeleteParams) {
  const dispatch = useAppDispatch();

  const deleteError = useAppSelector(selectProductsDeleteError);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    return () => {
      dispatch(clearProductsDeleteError());
    };
  }, [dispatch]);

  const openConfirm = () => {
    dispatch(clearProductsDeleteError());
    setIsConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (isDeleting) {
      return;
    }

    setIsConfirmOpen(false);
  };

  const handleConfirm = async () => {
    if (isDeleting) {
      return;
    }

    let wasDeleted = false;

    dispatch(clearProductsDeleteError());
    setIsDeleting(true);

    try {
      await dispatch(deleteProduct(productId)).unwrap();
      wasDeleted = true;
    } catch {
      // The rejected thunk already writes the readable error to deleteError.
    } finally {
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }

    if (wasDeleted) {
      onDeleted();
    }
  };

  return {
    isConfirmOpen,
    isDeleting,
    deleteError,
    openConfirm,
    closeConfirm,
    handleConfirm,
  };
}
