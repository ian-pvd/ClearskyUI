// @ts-check
/// <reference path="../../../types.d.ts" />

import React from 'react';

import { breakFeedUri, isPromise, likelyDID, resolveHandleOrDID, unwrapShortDID, unwrapShortHandle } from '../../../api';
import { getPost, getPostThread } from '../../../api/post-history';

import { Tooltip } from '@mui/material';
import { AccountShortEntry } from '../../../common-components/account-short-entry';
import { forAwait } from '../../../common-components/for-await';
import { FormatTimestamp } from '../../../common-components/format-timestamp';
import { useResolveAccount } from '../../../common-components/use-resolve-account';
import { PostContentText } from './post-content-text';
import { PostEmbed } from './post-embed';

import './render-post.css';
import { localise } from '../../../localisation';

/**
 * @param {{
 *  post: PostDetails | undefined,
 *  className?: string,
 *  disableEmbedQT?: boolean | ((level: number, post: PostDetails) => boolean),
 *  level?: number,
 *  textHighlights?: string,
 *  textLightHighlights?: string
 * }} _
 */
export function RenderPost({ post, className, disableEmbedQT, level, textHighlights, textLightHighlights, ...rest }) {
  if (!post) return undefined;
  const postUri = breakFeedUri(/** @type {string} */(post.uri));

  const accountOrPromise = postUri?.shortDID && resolveHandleOrDID(postUri?.shortDID) || undefined;

  return (
    <div {...rest} className={'post-with-content ' + (className || '')}
      onClick={(e) => {
        e.preventDefault();
        (async () => {
          console.log('clicked post', post);
          for await (const p of getPostThread(post.uri)) {
            console.log('thread post', p);
          }
        });
      }}>
      <h4 className='post-header'>
        {
          !postUri?.shortDID ? <UnknownAccountHeader post={post} /> :
            <>
              <AccountShortEntry
                account={postUri.shortDID}
              />
              <FormatTimestamp
                className='post-timestamp'
                timestamp={post.createdAt}
                Component='a'
                // @ts-ignore
                href={createPostHref(
                  isPromise(accountOrPromise) ? postUri?.shortDID : accountOrPromise?.shortHandle,
                  postUri?.postID)}
                target='_blank'
                tooltipExtra={
                  <div className='post-timestamp-tooltip'>
                    <div className='post-timestamp-tooltip-post-uri'>
                      {post.uri}
                    </div>
                    {localise('Open in new tab', { uk: 'Відкрити в новій вкладці' })}
                  </div>
                }
              />
            </>
        }
        {
          !post.reply ? undefined :
            <>
              <ReplyToLink post={post} className='post-replying-to-marker' />
            </>
        }
      </h4>
      <PostContentText
        className='post-content'
        highlightClassNameBase='post-content-highlight'
        facets={post.facets}
        textHighlights={textHighlights}
        textLightHighlights={textLightHighlights}
        text={post.text} />
      {
        <PostEmbed post={post} embed={post.embed} disableEmbedQT={disableEmbedQT} level={(level || 0) + 1} />
      }
    </div>
  );
}


function UnknownAccountHeader({ post }) {
  const postUri = breakFeedUri(/** @type {string} */(post.uri));
  return localise('Unknown account ', {uk: 'Невідомий акаунт '}) + (postUri?.shortDID || post.uri);
}

/**
 * @param {{
 *  post: PostDetails,
 *  className?: string
 * }} _
 */
function ReplyToLink({ post, ...rest }) {
  const replyUri = breakFeedUri(post.reply?.parent?.uri);
  const rootUri = breakFeedUri(post.reply?.root?.uri);

  const replyAccount = useResolveAccount(replyUri?.shortDID);
  const rootAccount = useResolveAccount(rootUri?.shortDID);

  if (!replyAccount && !rootAccount) return undefined;

  return (
    <span {...rest}>
      {
        !replyAccount ? undefined :
          <>
            <span className='post-replying-to-marker-text'>&lsaquo;</span>
            <Tooltip title={<RenderPostInTooltip postUri={post.reply?.parent?.uri} />}>
              <a href={createPostHref(replyAccount.shortHandle, replyUri?.postID)} target='_blank'>
                <MiniAvatar className='post-replying-to-resolved' account={replyAccount} />
              </a>
            </Tooltip>
          </>
      }
      {
        !rootAccount || rootAccount.shortHandle === replyAccount?.shortHandle ? undefined :
          <>
            <span className='post-replying-to-marker-text'>&lsaquo;</span>
            <Tooltip title={<RenderPostInTooltip postUri={post.reply?.root?.uri} />}>
              <a href={createPostHref(rootAccount.shortHandle, rootUri?.postID)} target='_blank'>
                <MiniAvatar className='post-replying-to-resolved post-replying-to-root' account={rootAccount} />
              </a>
            </Tooltip>
          </>
      }
    </span>
  );
}

/**
 * @param {{
 *  postUri: string | null | undefined
 * }} _
 */
function RenderPostInTooltip({ postUri }) {
  if (!postUri) return undefined;
  const post = forAwait(postUri, getPost);
  return (
    <RenderPost post={post} disableEmbedQT className='post-content-embed-qt' />
  );
}


function MiniAvatar({ account, className, ...rest }) {
  return (
    <span className={'post-replying-mini-avatar ' + (className || '')} style={
      !account.avatarUrl ? undefined :
        { backgroundImage: `url(${account.avatarUrl})` }
    } {...rest}>{account.displayName}</span>
  );
}

/**
 * @param {string | null | undefined } handleOrDID
 * @param {string | null | undefined} postID
 */
function createPostHref(handleOrDID, postID) {
  if (!handleOrDID || !postID) return;
  return `https://bsky.app/profile/${likelyDID(handleOrDID) ?
    unwrapShortDID(handleOrDID) : unwrapShortHandle(handleOrDID)}/post/${postID}`;
}
