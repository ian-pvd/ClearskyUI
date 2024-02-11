// @ts-check

import React, { useState } from 'react';

import SearchIcon from '@mui/icons-material/Search';
import { Button } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

import { isPromise, resolveHandleOrDID } from '../../api';
import { getListCached } from '../../api/lists';
import { forAwait } from '../../common-components/for-await';
import { ListView } from './list-view';

import './lists.css';
import { ViewList } from '@mui/icons-material';
import { SearchHeaderDebounced } from '../history/search-header';

/**
 * @this {never}
 * @param {{
 *  className?: string,
 *  account: AccountInfo | { shortHandle: String, loading: true }
 * }} _
 */
export function Lists({ account }) {
  const list = forAwait(
    account?.shortHandle,
    async (shortHandle) => {
      const lists = await getListCached(shortHandle);
      return { lists, loading: false };
    }) || { loading: true };
  
  const [tableView, setTableView] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [tick, setTick] = useState(0);
  const search = (searchParams.get('q') || '').trim();

  const [showSearch, setShowSearch] = useState(!!search);

  const filteredLists = !search || !list?.lists ? list?.lists :
    matchSearch(list?.lists, search, () => setTick(tick + 1));
  
  return (
    <>
      <div>
        <div style={showSearch ? undefined : { display: 'none' }}>
          <SearchHeaderDebounced
            label='Search'
            setQ />
        </div>
      </div>

      <h3 className='lists-header'>
        {
          list?.loading ? 'Member in lists:' :
          list?.lists?.length ? 
            <>
              Member in <span>{list.lists.length.toLocaleString()}</span> lists:

              <span className='panel-toggles'>
                {
                  showSearch ? undefined :
                    <Button size='small' className='panel-show-search' onClick={() => setShowSearch(true)}><SearchIcon /></Button>
                }
                <Button variant='contained' size='small' className='panel-toggle-table' onClick={() => setTableView(!setTableView)}>
                  <ViewList />
                </Button>
              </span>
            </> :
            <>
              Not a member of any lists
            </>
        }
      </h3>
      <ListView
        account={account}
        list={filteredLists} />
    </>
  );
}

/**
 * @param {AccountListEntry[]} blocklist
 * @param {string} search
 * @param {() => void} [redraw]
 */
function matchSearch(blocklist, search, redraw) {
  const searchLowercase = search.toLowerCase();
  const filtered = blocklist.filter(entry => {
    if ((entry.handle || '').toLowerCase().includes(searchLowercase)) return true;
    if ((entry.name || '').toLowerCase().includes(searchLowercase)) return true;
    if ((entry.description || '').toLowerCase().includes(searchLowercase)) return true;

    const accountOrPromise = resolveHandleOrDID(entry.handle);
    if (isPromise(accountOrPromise)) {
      accountOrPromise.then(redraw);
      return false;
    }

    if ((accountOrPromise.displayName || '').toLowerCase().includes(searchLowercase)) return true;
  });
  return filtered;
}