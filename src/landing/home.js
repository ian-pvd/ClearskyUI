// @ts-check
import React from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { unwrapShortHandle } from '../api';
import { HomeHeader } from './home-header';

import './home.css';
import { Logo } from './logo';
import { HomeStats } from './home-stats';
import { About } from './about';

export function Home() {

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = React.useState(searchParams.get('q') || '');
  const [aboutOpen, setAboutOpen] = React.useState(false);
  const navigate = useNavigate();

  return (
    <div className={'home ' + (aboutOpen ? 'about-open' : '')}>
      <Logo />
      <About onToggleAbout={() => setAboutOpen(!aboutOpen)} />
      <HomeHeader className='home-header'
        searchText={searchText}
        onSearchTextChanged={searchText => {
          setSearchText(searchText);
          setSearchParams({ q: searchText });
        }}
        onAccountSelected={(account) => {
          console.log('Account selected ', account);
          if (account.shortHandle) {
            if (account.postID)
              navigate('/' + unwrapShortHandle(account.shortHandle) + '/history/?q=' + account.postID);
            else
              navigate('/' + unwrapShortHandle(account.shortHandle));
          }
        }}
      />
      <HomeStats className='home-stats' />
    </div>
  );
}
