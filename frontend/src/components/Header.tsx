import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearMockAuthSession, getMockAuthSession } from '../utils/authSession';
import { useI18n } from '../i18n';
import './Header.css';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [phone, setPhone] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    const session = getMockAuthSession();
    setPhone(session?.phone_number ?? null);
  }, [location.pathname]);

  const logout = () => {
    clearMockAuthSession();
    setPhone(null);
    navigate('/login', { replace: true });
  };

  const displayPhone =
    phone && phone.length > 8 ? `${phone.slice(0, 4)}…${phone.slice(-3)}` : phone;
  const navLinks = [
    { label: 'Home', to: '/dashboard' },
    { label: 'Profile', to: '/profile' },
    { label: 'Watch', to: '/streaming' },
    { label: 'Play', to: '/gameplay' },
    { label: 'Earn & Share', to: '/earn-share' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="navbar-logo">GAME PLAZIO</Link>
        <div className="navbar-links">
          <div className="hidden md:flex gap-6 ml-8">
            {navLinks.map((link) => {
              const isHomeActive = link.to === '/dashboard' && location.pathname === '/dashboard';
              const [linkPath, linkSearch] = link.to.split('?');
              const isActive = isHomeActive || (location.pathname === linkPath && (!linkSearch || location.search === `?${linkSearch}`));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={
                    isActive
                      ? 'text-primary font-bold border-b-2 border-primary hover:text-primary transition-all duration-300'
                      : 'text-on-surface-variant font-medium hover:text-primary transition-all duration-300'
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          {phone ? (
            <>
              <span className="navbar-user" title={phone}>
                {displayPhone}
              </span>
              <button type="button" className="navbar-logout" onClick={logout}>
                {t('header.logout', 'Log out')}
              </button>
            </>
          ) : (
            <Link to="/login" className="navbar-login">
              {t('header.login', 'Log in')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
