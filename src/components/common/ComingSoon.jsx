import { HiOutlineWrench } from 'react-icons/hi2';

const ComingSoon = ({ title = 'Coming Soon', description = 'This module is under development.' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-20 h-20 rounded-2xl bg-surface-100 flex items-center justify-center mb-6">
        <HiOutlineWrench className="w-10 h-10 text-surface-400" />
      </div>
      <h2 className="text-2xl font-bold text-surface-900 mb-2">{title}</h2>
      <p className="text-surface-500 text-center max-w-md">{description}</p>
    </div>
  );
};

export default ComingSoon;
