import { createContext, useContext } from 'react';

export const AddJewelryProductContext = createContext(null);

export const useAddJewelryProductContext = () => {
  const context = useContext(AddJewelryProductContext);
  if (!context) {
    throw new Error('useAddJewelryProductContext must be used within an AddJewelryProductProvider');
  }
  return context;
};

export default AddJewelryProductContext;
