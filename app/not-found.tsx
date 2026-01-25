import { redirect } from 'next/navigation';

const NotFound = () => {
  redirect('/');
  return null;
};

export default NotFound;
