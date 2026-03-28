import { Link, Outlet } from 'react-router-dom';
import { Button } from '../components/Button';
import { LogoMark } from '../components/LogoMark';

export function PublicLayout() {
  return (
    <div className='page-shell grid-pattern'>
      <div className='relative z-10 min-h-screen'>
        <header className='mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8'>
          <Link to='/'>
            <LogoMark />
          </Link>
          <div className='flex items-center gap-3'>
            <Link to='/login'>
              <Button variant='ghost'>Login</Button>
            </Link>
            <Link to='/register'>
              <Button>Get Started</Button>
            </Link>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
