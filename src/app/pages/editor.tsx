import styled from '@emotion/styled';
import CodeMirrorEditor, {
  EditorState,
  EditorView,
  ReactCodeMirrorRef,
  ViewUpdate,
} from '~/lib/codemirror-editor';
import {
  ChangeSpec,
  Compartment,
  type StateEffect,
  StateField,
  Transaction,
  ChangeSet,
} from '@codemirror/state';
import { actions, store, useStore } from '~/stores';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCollabExtension } from './plugins/collab';
import { search } from '@codemirror/search';
import {
  commonExtensions,
  editorModeExtension,
  getLanguageExtensions,
  indentUnitExtensions,
} from './plugins/extensions';
import blockquotePlugin from './plugins/blockquotePlugin';
import { getLspExtension, getLspLanguageIdFromSuffix } from './plugins/lsp';
import React from 'react';
import { URI } from 'vscode-uri';
import {
  basicSetup,
  hiddenLineNumbersTheme,
  visibleLineNumbersTheme,
} from './plugins/basicSetup';
import {
  CodeSnippetOption,
  CodeSnippetType,
  DetectDiffModeCallbackResult,
  DiffModeType,
  EditorIndentMode,
  EditorProps,
  InsertCodeLineCode,
  ReportHighlightCache,
} from '~/types/DaoPaaS';
import { IDaoEditorSpace } from '~/types/DaoEditor';

import { Messages } from '~/constants/messages';
import readOnlyRangesExtension, {
  clearReadOnlyStartTagCache,
  getReadOnlyRanges,
} from './plugins/readonlyRangesPlugin';
import { lineDecoratorPlugin } from './plugins/lineDecoratorPlugin';

import MessageComp from '../base/Message';
import { getScrollPlugin, syncViewScrollExtension } from './plugins/scroll';
import { useClientRect } from '~/hooks/useClientRect';
import { getRegxByType } from '~/utils';
import {
  CONTEXTMEN_EVENT,
  CUSTOMIZE_INSERT_CODE_EVENT,
  RegExpType,
  SCROLL_BY_LINE_USER_EVENT,
} from '~/constants';
import { useTranslation } from 'react-i18next';
import { customkeys } from './plugins/customKeys';
import { Events } from '~/constants/events';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { debugLineDecorator } from './plugins/debugger/lineDecorator';
import {
  gutterTheme,
  disableGutterTheme,
  debugBreakPoint,
  isSupportDebug,
  illegalLines,
} from './plugins/debugger/breakPoint';
import { debugToolTip } from './plugins/debugger/toolTip';
import logger from '~/helpers/logger';

import { domEventHandlers } from './plugins/domEventHandlersPlugin';

import {
  placeholderWithState as placeholder,
  placeholderLinePlugin,
  placeholderTheme,
} from './plugins/placeholder';
import { indentRange } from '@codemirror/language';
import detectIndent from 'detect-indent';
import {
  playbackPauseTheme,
  playbackPlayTheme,
  playbackSelections,
} from './plugins/remote-selections';
import { answerAreaTooltip } from './plugins/answerAreaTooltip';
import { answerAreaClickListener } from '~/lib/codemirror-editor/src/utils';
import { DefinitionResult } from '~/lib/codemirror-languageserver/src/utils';
import { posToOffset } from '~/lib/codemirror-languageserver/src';
import { Text } from '@codemirror/state';
import {
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
} from '@codemirror/view';
import {
  onDaoEditorMessage,
  triggerInsertCodeByCursorPosition,
  triggerReplayCodeByRange,
  updateLineHighlightData,
} from './utils/editorTool';
import { highLightKeywordPlugin } from './plugins/keywordHighlight';
import { lineGutter } from './plugins/highlightGutter';
import { reportHighlightPlugin } from './plugins/reportHighlightPlugin';
import { divideLinePlugin } from './plugins/divideLinePlugin';

import {
  animatableDiffView,
  updateOriginalDoc,
} from './plugins/diff-view/animatable-diff-view';
import { animatableDiffViewCompartment } from './plugins/diff-view/diff-actions';
import { cmdkInputCard } from './plugins/cmdk-input-card';
import { CodeLoader } from './CodeLoader';
import { floatingToolbar } from './plugins/floating-toolbar';

import {
  getLastSnapshotKey,
  getSnapshot,
  saveLastSnapshotChange,
} from './utils/diffToolbar';
import {
  getChunks,
  getCurrentChunkIndex,
  goToChunk,
} from './plugins/diff-view/merge';
import {
  paddingBottomPlugin,
  addPaddingBottom,
} from './plugins/bottom-padding-widget';
import DiffToolbar from './components/DiffToolbar';
import { RegenerateModal } from './components/Regenerate';
import {
  restoreAIChange,
  revertAIChange,
} from './components/DiffToolbar/difftoolbar';
import { scrollToAndCenterAtPos } from './utils/editor-actions';
import {
  lintGutter,
  linter,
} from '~/components/Editor/plugins/codemirror-lint/lint';
import {
  codeNavigationHistory,
  setCursorPosForFileOpen,
} from '~/utils/code-jump-backward-forward';
import { codeNavBackwardForwardPlugin } from './plugins/code-nav-backward-forward';
import { showMinimap } from './plugins/codemirror-minimap';

export type EditorHistoryState = Record<
  string,
  {
    json: any;
    fields: {
      history: StateField<unknown>;
    };
  }
>;

interface CodeEditorProps extends EditorProps {
  editorHistoryState: React.MutableRefObject<EditorHistoryState>;
  lineHighlightCompartment: Compartment;
}

const CodeEditorLayout = styled.div`
  &.d42-code-editor-layout {
    height: calc(100% - 28px);
  }

  .editor-with-toolbar {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .cm-editor {
    height: 100%;
  }
  .cm-scroller {
    /* scroll-behavior: smooth; */
    font-family: 'Roboto Mono', SFMono-Regular, Consolas, Liberation Mono, Menlo,
      monospace;
  }
  .d42-editor-container {
    height: 100%;
    &.d42-editor-readonly {
      cursor: not-allowed;
    }
    .cm-search {
      padding-right: 15px;
      input {
        outline: none;
      }
    }
  }
  .cm-scroller {
    &::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 7px;
      background: var(--d42-tree__root-scrollbar-thumb--bg);
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-corner {
      background-color: transparent;
    }
  }

  .d42-editor-loading {
    padding: 15px;
  }

  div {
    outline: none;
  }
`;
export function getKeywords(doc: string) {
  const words: string[] = [];
  doc.replace(/([\w_-]+)/gim, (match, $1: string) => {
    words.push($1);
    return $1;
  });
  return words;
}
export function keyWordsCompletions(
  context: CompletionContext,
  codeSnippet?: CodeSnippetType,
) {
  const word = context.matchBefore(/\w*/);
  if (!word) {
    return null;
  }
  const words: string[] = getKeywords(context.state.doc.toJSON().join(' '));
  const ext = store.file.doc().ext;

  if (word.from == word.to && !context.explicit) return null;

  const key = Object.keys(codeSnippet || {}).find((keys) =>
    (keys?.split('|') || []).includes(ext),
  );
  const snippetLabels = key ? codeSnippet?.[key] || [] : [];
  const keyword = [
    ...new Set(
      words.filter((key) => {
        return (
          key.includes(word.text) &&
          key !== word.text &&
          snippetLabels.every(
            (item: CodeSnippetOption) => item.option.label !== key,
          )
        );
      }),
    ),
  ].map((item) => {
    return {
      label: item,
      type: 'keyword',
    };
  });
  return {
    from: word.from,
    options: keyword,
  };
}

export const CodeEditor: React.FC<CodeEditorProps> = React.memo((props) => {
  const { t } = useTranslation();
  const {
    contextMenu,
    codeSnippet,
    translate,
    placeholders,
    defaultPlaceholder,
    lineHighlightCompartment,
    detectDiffModeCallback,
    cmdkCallback,
    addToChatCallback,
    revertRestoreCallback,
    revertRestoreDialogCallback,
    regenerateCallback,
    onCustomSelect,
    fixInChatCallback,
  } = props;
  const channel = useStore().dao.channel();
  const playbackStatus = useStore().dao.playbackStatus();
  const statusBeforeGotoPlayback = useStore().dao.statusBeforeGotoPlayback();
  const editorPlugins = useStore().config.editorPlugins();
  const currentLanguage = useStore().i18n.getLanguage();
  const isVirtualUser = useStore().dao.isVirtualUser();
  const {
    openedPath,
    content,
    revision,
    selection,
    agentUserId: operatorAgentUserId,
  } = useStore().file.doc();
  const searchKeywordInfo = useStore().file.searchKeywordInfo();
  const isPlayBack = useStore().dao.isPlayBack();
  const editable = useStore().file.docEditable() && !isPlayBack;
  const { lspRootPath, lspLanguageId, debugSupport } =
    useStore().dao.playgroundInfo();
  const isOpenDebugMode = useStore().dao.isOpenDebugMode();
  const deletedPath = useStore().file.deletedPath();
  const docLoading = useStore().file.docLoading();
  const stopLsp = useStore().config.stopLsp();
  const openFileParams = useStore().file.openFileParams();
  const {
    editorMode: mode = 'default',
    editorTabSize = 2,
    editorWordWrap = true,
    editorIndentMode = 'space',
    fontSize = '14px',
  } = useStore().config.globalConfig();
  const { disableEditable } = useStore().dao.config();
  const smartIndent = useStore().dao.smartIndent();
  // 智能缩进
  const size = editorTabSize === 'auto' ? smartIndent.size : editorTabSize;
  const indentMode: EditorIndentMode =
    editorTabSize === 'auto' ? smartIndent.mode : editorIndentMode;
  const tabSize = Number(size);
  const lspClient = useStore().file.lspClient();
  const lspTransport = useStore().file.lspTransport();
  const doc = useStore().file.doc();
  const isAnswerAreaMenuExpanded = useStore().dao.isAnswerAreaMenuExpanded();
  const rootUri = process.env.PAAS_CLIENT_DEBUG
    ? process.env.PASS_CLIENT_LSP_WORKSPACE_DIR
    : lspRootPath;

  const hotKeys = useStore().dao.hotKeys();
  const aiCodeInfo = useStore().file.aiCodeInfo();
  const isSplitCode = useStore().config.isSplitCode();
  const lspAction = useRef<Compartment>(new Compartment());
  const enableAction = useRef<Compartment>(new Compartment());
  const answerAreaAction = useRef<Compartment>(new Compartment());
  const gutterThemeAction = useRef<Compartment>(new Compartment());
  const clickEventAction = useRef<Compartment>(new Compartment());
  const activeLine = useRef<Compartment>(new Compartment());
  const fontSizeSettings = useRef<Compartment>(new Compartment()); // 动态设置编辑器字体大小
  const keywordHighlight = useRef<Compartment>(new Compartment()); // 关键词全局搜索高亮
  const reportHighlight = useRef<Compartment>(new Compartment()); // 回放报告高亮
  const collabThemeAction = useRef<Compartment>(new Compartment());
  const lineNumberThemeAction = useRef<Compartment>(new Compartment());
  const hotKeysAction = useRef<Compartment>(new Compartment());
  const cmdkInputCompartment = useRef<Compartment>(new Compartment());
  const currentAgentUserId = useStore().dao.currentAgentUserId();
  // const currentAgentUser = useStore().dao.currentAgentUser();
  const currentReallyAgentUserId = useStore().dao.currentReallyAgentUserId();
  // const collabAction = useRef<Compartment>(new Compartment());
  const [rectEditorRef, editorRef, setRectEditorRef] =
    useClientRect<ReactCodeMirrorRef | null>(null);

  // if undefined, show CodeLoader component to avoid render editor too early to overwrite latest content
  const [enableDiffView, setEnableDiffView] = useState<boolean | undefined>(
    undefined,
  );
  const [originalContent, setOriginalContent] = useState<string | undefined>(
    undefined,
  );
  const [snapshotContent, setSnapshotContent] = useState<string | undefined>(
    undefined,
  );
  const [enableDiffAnimation, setEnableDiffAnimation] = useState(false);
  const [showAnimeWithDiffOff, setShowAnimeWithDiffOff] = useState(false);

  // diff toolbar info
  const [shouldSaveSnapshot, setShouldSaveSnapshot] = useState(false);

  const [diffToolbarData, setDiffToolbarData] = useState<any | null>(null);
  const [currentActionIndex, setCurrentActionIndex] = useState(-1);
  const [currentOpenActionIndex, setCurrentOpenActionIndex] = useState(0);
  const [historyLength, setHistoryLength] = useState(0);

  const [diffModeType, setDiffModeType] =
    useState<DiffModeType>('topBottomLayout');
  const showDiffWithSnapshot = useMemo(() => {
    if (!diffToolbarData || !diffToolbarData.actionsInfo) return false;

    return (
      enableDiffView &&
      originalContent != null &&
      currentActionIndex !== currentOpenActionIndex &&
      currentActionIndex !== -1 &&
      diffToolbarData?.actionsInfo[currentOpenActionIndex].status !==
        'in_progress'
    );
  }, [
    enableDiffView,
    originalContent,
    currentActionIndex,
    currentOpenActionIndex,
    diffToolbarData,
  ]);

  const editorEnable = !disableEditable && editable;
  const aiNotDone = aiCodeInfo.find((item) => !item.isDone);
  const isReadonly = useMemo(() => {
    if (showDiffWithSnapshot) return true;
    if (isSplitCode) return false;
    return !editorEnable || !!aiNotDone;
  }, [aiNotDone, editorEnable, isSplitCode, showDiffWithSnapshot]);

  useEffect(() => {
    // scroll to chunks
    const view = rectEditorRef?.view;

    if (!view) return;
    if (!rectEditorRef?.view?.state) return;

    const chunks = getChunks(rectEditorRef?.view?.state);
    if (chunks && chunks.chunks.length > 0) {
      const pos = chunks.chunks[0].fromB;
      const { number: lineNumber } = view.state.doc.lineAt(pos);
      const lineHeight =
        view.dom.getBoundingClientRect().height / view.state.doc.lines;
      const totalLines = view.state.doc.lines;
      const viewport = view.scrollDOM.getBoundingClientRect();
      const targetArea = (totalLines - lineNumber) * lineHeight;
      const canScrollCenter = targetArea > viewport.height / 2;

      rectEditorRef.view.dispatch({
        effects: [
          EditorView.scrollIntoView(pos, {
            y: canScrollCenter ? 'center' : 'end',
          }),
        ],
      });
    }
  }, [rectEditorRef?.view]);

  useEffect(() => {
    const dealDetectDiffModeCallback = async (openedPath: string) => {
      if (detectDiffModeCallback) {
        const res: DetectDiffModeCallbackResult = await detectDiffModeCallback(
          openedPath,
        );

        if (!res.enableDiffMode && !res.enableDiffAnimation) {
          setEnableDiffView(false);
          return;
        }

        setEnableDiffView(true);

        if (res.originContent == null) {
          logger.warn('enableDiffMode is true, but originContent is empty');
          return;
        }
        setOriginalContent(res.originContent);

        if (res.snapshotContent != null) {
          setSnapshotContent(res.snapshotContent);
        }

        if (res.diffModeType) {
          setDiffModeType(res.diffModeType);
        }

        if (res.enableDiffAnimation) {
          setEnableDiffAnimation(res.enableDiffAnimation);
        }

        if (!res.enableDiffMode && res.enableDiffAnimation) {
          setShowAnimeWithDiffOff(true);
        }

        if (res.shouldSaveSnapshot) {
          setShouldSaveSnapshot(res.shouldSaveSnapshot);
        }

        if (res.diffToolbarData) {
          setDiffToolbarData(res.diffToolbarData);
        }
      } else {
        setEnableDiffView(false);
      }
    };
    dealDetectDiffModeCallback(openedPath);
  }, [detectDiffModeCallback, openedPath]);

  useEffect(() => {
    const effects: StateEffect<unknown>[] = [];
    effects.push(
      animatableDiffViewCompartment.reconfigure(
        enableDiffView && originalContent != null
          ? animatableDiffView({
              original: originalContent,
              gutter: false,
              showTypewriterAnimation: enableDiffAnimation,
              showAnimeWithDiffOff,
            })
          : [],
      ),
    );
    if (rectEditorRef && rectEditorRef.view) {
      rectEditorRef.view.dispatch({
        effects: effects,
      });
    }
  }, [
    enableDiffAnimation,
    enableDiffView,
    originalContent,
    rectEditorRef,
    showAnimeWithDiffOff,
  ]);

  useEffect(() => {
    const callback = (message: Message) => {
      const { name, payload } = message;
      if (name === Events.LspServerClientStateChange) {
        const { ready } = payload;
        if (ready && revision !== undefined) {
          const suffixPoint = doc.openedPath.lastIndexOf('.');

          if (suffixPoint === -1) return [];
          const suffix = doc.openedPath.substring(suffixPoint);
          const lspLanguageId_ =
            getLspLanguageIdFromSuffix(suffix) || lspLanguageId;
          lspClient?.initOpen({
            documentText: doc.content,
            documentUri: `file://${rootUri}/${doc.openedPath}`,
            documentVersion: revision,
            languageId: lspLanguageId_,
          });
        }
      }
    };
    store.dao.channel().addMessageListener(callback);
    return () => {
      store.dao.channel().removeMessageListener(callback);
    };
  }, [
    doc.content,
    doc.openedPath,
    lspClient,
    lspLanguageId,
    revision,
    rootUri,
  ]);

  useEffect(() => {
    const view = rectEditorRef?.view;
    view &&
      view.dispatch({
        effects: fontSizeSettings.current.reconfigure(
          EditorView.editorAttributes.of({
            style: 'font-size : ' + fontSize,
          }),
        ),
      });
  }, [fontSize, rectEditorRef?.view]);

  useEffect(
    () => () => {
      setRectEditorRef(null);
      clearReadOnlyStartTagCache();
    },
    [setRectEditorRef],
  );

  useEffect(() => {
    const view = rectEditorRef?.view;
    if (view) {
      view.dispatch({
        effects: hotKeysAction.current.reconfigure(keymap.of(hotKeys)),
      });
    }
  }, [hotKeys, rectEditorRef?.view]);

  // TODO: 使用这种方式设置断点有问题
  // useEffect(() => {
  //   const view = rectEditorRef?.view;
  //   if (view) {
  //     let extension: Extension[] = [];
  //     if (isPlayBack) {
  //       // 回放模式时，光标和选中区域也要显示
  //       extension = playbackSelections;
  //     } else if (docLoading) {
  //       extension = [];
  //     } else {
  //       extension = getCollabExtension({
  //         startVersion: revision,
  //       });
  //     }
  //     view.dispatch({
  //       effects: collabAction.current.reconfigure(extension),
  //     });
  //   }
  // }, [isPlayBack, docLoading, revision, rectEditorRef?.view]);

  const collabExtension = useMemo(() => {
    if (isPlayBack) {
      // 回放模式时，光标和选中区域也要显示
      return playbackSelections;
    }
    if (docLoading || enableDiffView == null || isReadonly) {
      return [];
    }
    return getCollabExtension({
      startVersion: revision,
      currentReallyAgentUserId: currentReallyAgentUserId || currentAgentUserId,
    });
  }, [
    isPlayBack,
    docLoading,
    enableDiffView,
    isReadonly,
    revision,
    currentReallyAgentUserId,
    currentAgentUserId,
  ]);

  useEffect(() => {
    const view = rectEditorRef?.view;
    if (view && isPlayBack) {
      /**
       * 1. playbackStatus为暂停状态时，不显示tooltip
       * 2. 快进状态时，如果快进前是pausePlayback或者complete。则隐藏tooltip
       */
      const isPause =
        playbackStatus === 'stopPlayback' ||
        playbackStatus === 'pausePlayback' ||
        playbackStatus === 'complete';
      const extension = isPause
        ? [playbackPauseTheme, visibleLineNumbersTheme]
        : [playbackPlayTheme, hiddenLineNumbersTheme];
      view.dispatch({
        effects: collabThemeAction.current.reconfigure(extension),
      });
    }
  }, [
    isPlayBack,
    playbackStatus,
    rectEditorRef?.view,
    statusBeforeGotoPlayback,
  ]);

  const lspExtension = useMemo(() => {
    if (!lspClient || !lspTransport || revision === undefined || isReadonly) {
      return [];
    }

    const defaultGoToDefinition = (result: DefinitionResult) => {
      if (!result?.uri) return;
      const openedPath = doc?.openedPath;
      const view = rectEditorRef?.view;
      const selectionRange = result.selectionRange;
      let resultUriPath = URI.parse(result.uri).path;
      resultUriPath = resultUriPath.startsWith('file://')
        ? resultUriPath.slice(7)
        : resultUriPath;

      if (view && selectionRange) {
        if (resultUriPath === lspRootPath + '/' + openedPath) {
          const selOffset = posToOffset(view.state.doc, selectionRange.start);
          codeNavigationHistory.record({
            path: openedPath,
            ...selectionRange.start,
          });
          scrollToAndCenterAtPos(view, selOffset);
        } else if (
          resultUriPath.startsWith(lspRootPath) &&
          !resultUriPath.startsWith(`${lspRootPath}${lspRootPath.slice(0, 11)}`)
        ) {
          const defPath = resultUriPath.slice(lspRootPath.length + 1);
          setCursorPosForFileOpen(defPath, selectionRange.start);
          if (onCustomSelect) {
            onCustomSelect([defPath], 'FILE');
          }
          codeNavigationHistory.record({
            path: defPath,
            ...selectionRange.start,
          });
          store.dao.channel().loadFile(defPath, 'refresh');
        } else {
          if (
            ['.zip', '.jar', '.class', '.tar', '.gz'].every(
              (item) => !resultUriPath.endsWith(item),
            )
          ) {
            setCursorPosForFileOpen(resultUriPath, selectionRange.start);
            if (onCustomSelect) {
              onCustomSelect([resultUriPath], 'FILE');
            }
            codeNavigationHistory.record({
              path: resultUriPath,
              ...selectionRange.start,
            });
            store.dao.channel().loadFile(resultUriPath, 'refresh');
          }
        }
      }
    };
    const lsExtension = getLspExtension(
      {
        rootUri: lspRootPath,
        lspLanguageId,
      },
      {
        transport: lspTransport,
        client: lspClient,
      },
      revision,
      keyWordsCompletions,
      defaultGoToDefinition,
      props.shouldSendEditorChangesCallback,
    );
    if (!lsExtension?.length || doc?.openedPath.startsWith('/')) {
      return [];
    }
    return lsExtension;
  }, [
    lspClient,
    lspLanguageId,
    lspRootPath,
    lspTransport,
    revision,
    keyWordsCompletions,
    doc?.openedPath,
    rectEditorRef?.view,
  ]);

  const messageListener = useCallback(
    (message: Message) => {
      const { name, payload } = message;
      if (!rectEditorRef) return;

      switch (name) {
        case Messages.UpdateAreaFlags: {
          const { ids = [] } = payload;
          const changes: Array<ChangeSpec> = [];
          const view = rectEditorRef.view as EditorView;
          const allLines = view.state.doc.toJSON();
          for (let i = 0; i < ids.length; i++) {
            const id = ids[i].id;
            const flag = ids[i].flag;
            const startRegx = getRegxByType(RegExpType.BLOCK_START_BY_ID, {
              id: id?.trim(),
            });
            if (rectEditorRef.view) {
              const startIndex = allLines.findIndex((line) =>
                startRegx.test(line),
              );
              if (startIndex < 0) {
                continue;
              }
              const line = view.state.doc.line(startIndex + 1);
              const { from, to } = line;
              let { text } = line;
              // 先不考虑中文等特殊字符（暂时只支持数字，字符串）
              const matchs = text.match(/"flag":"(\w+)"([,|}])/);
              if (matchs) {
                const originFlag = matchs[1];
                if (originFlag === flag) {
                  continue;
                }
                text = text.replace(`(${originFlag})`, `(${flag})`);
                text = text.replace(
                  /("flag":"(\w+)")([,|}])/,
                  ($m, $1, $2, $3) => {
                    return `"flag":"${flag}"${$3}`;
                  },
                );
              } else {
                // 历史记录的处理
                const tempMatchs = text.match(/(\[\{.*\}\])/);
                if (tempMatchs) {
                  const json = JSON.parse(tempMatchs[0]) as any;
                  json[0].flag = flag;
                  text = text.replace(/(\[\{.*\}\])/, JSON.stringify(json));
                  text = text.replace(
                    /^((.*)\[\{)/,
                    ($match: string, $1: string, $2: string) => {
                      const item = contextMenu?.items.find((item) =>
                        $1.includes(item.commentStartLabel),
                      );
                      if (item?.commentStartLabel) {
                        $1 = $1.replace(
                          item?.commentStartLabel,
                          `(${flag})${item?.commentStartLabel}`,
                        );
                      }
                      return $1;
                    },
                  );
                } else {
                  continue;
                }
              }
              changes.push({
                from,
                to,
                insert: text,
              });
            }
          }
          if (changes.length) {
            view?.dispatch({
              changes,
              userEvent: CONTEXTMEN_EVENT, // 标记为特殊事件
            });
          }
          return;
        }
        case Messages.JumpToAreaById: {
          const { id } = payload;
          if (id && rectEditorRef.view) {
            const view = rectEditorRef.view as EditorView;
            const allLines = view.state.doc.toJSON();
            const startRegx = getRegxByType(RegExpType.BLOCK_START_BY_ID, {
              id: id?.trim(),
            });
            const startIndex = allLines.findIndex((line) =>
              startRegx.test(line),
            );

            const targetLine = view.state.doc.line(startIndex + 2);
            // 需要聚焦content，要不然光标不会聚焦
            if (!disableEditable && editable) {
              view.focus();
            }
            view?.dispatch({
              selection: { anchor: targetLine.to, head: targetLine.to },
              // 居中显示
              effects: [
                EditorView.scrollIntoView(targetLine.from, {
                  y: 'center',
                }),
                // $ 在domEventHandlersPlugin -> freezeCode 会把editable设置为false情况，这里为了光标聚焦需要设置成true
                enableAction.current.reconfigure([
                  EditorView.editable.of(true),
                ]),
              ],
            });
          }
          break;
        }
        case Messages.ReplaceCodeById: {
          try {
            const { id, text } = payload;
            const startRegx = getRegxByType(RegExpType.BLOCK_START_BY_ID, {
              id: id?.trim(),
            });
            const endRegx = getRegxByType(RegExpType.BLOCK_END_BY_ID, {
              id: id?.trim(),
            });
            if (text && rectEditorRef.view) {
              const view = rectEditorRef.view as EditorView;
              const allLines = view.state.doc.toJSON();
              const startIndex = allLines.findIndex((line) =>
                startRegx.test(line),
              );
              if (startIndex < 0) {
                return;
              }
              // 判断如果是起始行， isEmpty为false
              const isDocStart = startIndex === 0 ? true : false;
              const isEmpty =
                !isDocStart &&
                view.state.doc.line(startIndex).text?.trim() === '';
              const endIndex = allLines.findIndex((line) => endRegx.test(line));
              const from = view.state.doc.line(
                isEmpty ? startIndex : startIndex + 1,
              ).from;

              // 如果是文档结尾，isEmptyEndNextLine为false
              const isDocEnd =
                endIndex + 2 > view.state.doc.lines ? true : false;
              const isEmptyEndNextLine =
                !isDocEnd &&
                view.state.doc.line(endIndex + 2).text?.trim() === '';

              const to = view.state.doc.line(
                isEmptyEndNextLine ? endIndex + 2 : endIndex + 1,
              ).to;
              view?.dispatch({
                changes: [
                  {
                    from,
                    to,
                    insert: decodeURI(text),
                  },
                ],
                userEvent: CONTEXTMEN_EVENT, // 标记为特殊事件
              });
            }
          } catch (e) {
            logger.info(e);
          }
          return;
        }
        case Messages.InsertTextById: {
          if (name !== Messages.InsertTextById) {
            return;
          }
          const { id, text } = payload;
          const lineNumVal: InsertCodeLineCode = payload.lineNum;
          try {
            if (text && rectEditorRef.view) {
              let targetLineIndex = -1;
              const view = rectEditorRef.view as EditorView;
              const allLines = view.state.doc.toJSON();
              if (id) {
                // 指定地方插入文本
                const regx = getRegxByType(RegExpType.BLOCK_START_BY_ID, {
                  id: id?.trim(),
                });
                targetLineIndex = allLines.findIndex((line) => regx.test(line));
                if (targetLineIndex > -1) {
                  // 从答题区显示的下一行插入
                  targetLineIndex = targetLineIndex + 2;
                }
              } else if (lineNumVal) {
                switch (lineNumVal) {
                  case 'TOP': {
                    targetLineIndex = 0;
                    break;
                  }
                  case 'BOTTOM': {
                    targetLineIndex = allLines.length;
                    break;
                  }
                  default: {
                    targetLineIndex =
                      +lineNumVal > allLines.length - 1
                        ? allLines.length - 1
                        : +lineNumVal;
                  }
                }
              }
              targetLineIndex = isNaN(+targetLineIndex) ? 0 : +targetLineIndex;
              if (targetLineIndex > -1) {
                let from = 0;
                const textVal = decodeURI(text);
                if (targetLineIndex) {
                  const targetLine = view.state.doc.line(targetLineIndex);
                  from = targetLine.to;
                }
                view?.dispatch({
                  changes: [
                    {
                      from,
                      insert: textVal,
                    },
                  ],
                  userEvent: CONTEXTMEN_EVENT, // 标记为特殊事件
                });
                // $ 格式化,插入代码对应的缩进.
                // 没找到与上面的dispatch合并在一起的写法
                const to = from + textVal.length;
                view.dispatch({
                  changes: indentRange(view.state, from, to),
                });
              }
            }
          } catch (e) {
            MessageComp.error(t('dao_pass_set_answer_wrong')); // 设置题目答案错误。
          }
          break;
        }
      }
    },
    [contextMenu?.items, disableEditable, editable, rectEditorRef, t],
  );

  useEffect(() => {
    if (rectEditorRef?.view) {
      channel.addMessageListener(messageListener);
      actions.dao.isAnswerSubscribed(true);
      // 判断是否存在待完成的答题区跳转或删除操作
      const waitingAreaInfo = store.dao.waitingAreaInfo();
      if (
        Object.keys(waitingAreaInfo).length &&
        // 内容没完成渲染不触发跳转逻辑
        rectEditorRef?.view.scrollDOM.clientHeight
      ) {
        const { type, id, text, ids } = waitingAreaInfo;
        if (type === 'jump') {
          store.dao.channel().transitionJumpToAreaById(id!);
        } else if (type === 'remove') {
          store.dao.channel().transitionRemoveAreaTextById(id!, text!);
        } else if (type === 'updateFlag') {
          store.dao.channel().transitionUpdateAreaFlags(ids!);
        }
        actions.dao.waitingAreaInfo({});
      }
    }
    return () => {
      if (rectEditorRef?.view) {
        channel.removeMessageListener(messageListener);
        actions.dao.isAnswerSubscribed(false);
      }
    };
  }, [channel, messageListener, rectEditorRef?.view]);

  const editorMessage = useCallback(
    (message: Message) => {
      const view = rectEditorRef?.view;
      if (!view) return;
      onDaoEditorMessage({ view, message, disableEditable, editable });
    },
    [rectEditorRef?.view, disableEditable, editable],
  );

  useEffect(() => {
    const view = rectEditorRef?.view;
    if (view) {
      channel.addMessageListener(editorMessage);
      // 代处理的编辑器行为
      const pendingEditorActions = store.dao.pendingEditorActions();
      if (
        Object.keys(pendingEditorActions).length &&
        // 内容没完成渲染不触发跳转逻辑
        view.scrollDOM.clientHeight
      ) {
        const { actions, payload } = pendingEditorActions;
        if (actions === Messages.InsertCodeByCursorPosition) {
          triggerInsertCodeByCursorPosition(
            payload! as IDaoEditorSpace.IInsertCodeParams,
          );
        } else if (actions === Messages.ReplayCodeByRange) {
          triggerReplayCodeByRange(
            payload! as IDaoEditorSpace.IReplayCodeParams,
          );
        }
      }
    }
    return () => {
      if (view) {
        channel.removeMessageListener(editorMessage);
      }
    };
  }, [channel, editorMessage, rectEditorRef?.view]);

  useEffect(() => {
    if (openedPath) {
      // 自动设置代码模式缩进
      if (editorTabSize === 'auto') {
        /**
         * 1. 新建文件时当内容为空时，type:undefined
         * 2. type为tab时，设置size为2
         * 3. 默认值设置为 'space' 、2
         */
        const { type, amount } = detectIndent(content ?? '');
        const size = type === 'space' ? amount : 2;
        const mode = type ?? 'space';
        actions.dao.smartIndent({
          size,
          mode,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorTabSize, openedPath]);

  useEffect(() => {
    const view = rectEditorRef?.view;
    if (view) {
      // contextMenu有改动时，更新插件
      const isRegister = !(isPlayBack || isAnswerAreaMenuExpanded);
      const extendsion = isRegister ? answerAreaTooltip(contextMenu) : [];
      view.dispatch({
        effects: answerAreaAction.current.reconfigure(extendsion),
      });
    }
  }, [contextMenu, isPlayBack, isAnswerAreaMenuExpanded, rectEditorRef?.view]);

  useEffect(() => {
    const view = rectEditorRef?.view;
    if (view) {
      // 存在答题区设置，监听光标聚焦点
      const clickListener = answerAreaClickListener();
      const extendsion =
        !contextMenu || !contextMenu.items.length ? [] : clickListener;
      view.dispatch({
        effects: clickEventAction.current.reconfigure(extendsion),
      });
    }
  }, [contextMenu, rectEditorRef?.view]);

  const getAllLspExtension = useCallback(() => {
    const { extension = [], hasAutocomplet } =
      getLanguageExtensions(codeSnippet);
    // $ lsp不支持，使用上下文解析和语言包默认的autoComplete
    if (!lspExtension.length && !extension.length) {
      return [
        autocompletion({
          icons: true,
          closeOnBlur: false,
          override: [
            (context) => {
              if (stopLsp) {
                return null;
              }
              return keyWordsCompletions(context);
            },
          ],
        }),
      ];
    }
    if (!lspExtension.length && extension.length && !hasAutocomplet) {
      const matchs = store.file.getOpenedPath().match(/\.(\w*)$/);
      const defaultLspLang = store.config.defaultLspLang() || [];
      if (matchs && matchs[1] && defaultLspLang.includes(matchs[1])) {
        return [...extension];
      }

      return [
        ...extension,
        autocompletion({
          icons: true,
          closeOnBlur: false,
          override: [
            (context) => {
              if (stopLsp) {
                return null;
              }
              return keyWordsCompletions(context);
            },
          ],
        }),
      ];
    }
    return [...extension, ...lspExtension];
  }, [codeSnippet, lspExtension]);

  useEffect(() => {
    const view = rectEditorRef?.view;
    if (view) {
      // 聚焦行，显示断点圆圈
      const isSupport = isSupportDebug();
      const extendsion = isSupport ? [gutterTheme] : [disableGutterTheme];
      view.dispatch({
        effects: gutterThemeAction.current.reconfigure(extendsion),
      });
    }
  }, [
    openedPath,
    debugSupport,
    isOpenDebugMode,
    disableEditable,
    rectEditorRef?.view,
  ]);

  useEffect(() => {
    // 当lspExtension插件更新时，应该只是更新单个插件，而不是全部插件
    // https://discuss.codemirror.net/t/how-update-extensions-after-creating/4064/7

    const view = rectEditorRef?.view;
    if (view) {
      const updateExtension = getAllLspExtension();
      try {
        view.dispatch({
          effects: lspAction.current.reconfigure(updateExtension),
        });
      } catch (error) {
        console.error('Error during reconfigure:', error);
      }
    }
  }, [getAllLspExtension, lspExtension, rectEditorRef?.view]);

  const translationExtension = useMemo(() => {
    if (translate) {
      const phrases = Object.keys(translate).reduce(
        (init: Record<string, string>, key) => {
          init[key] = translate[key][currentLanguage.toString()] || key;
          return init;
        },
        {},
      );
      return EditorState.phrases.of(phrases);
    }
    return EditorState.phrases.of({});
  }, [currentLanguage, translate]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getPlaceHolders = () => {
    const placeholderText =
      placeholders?.[openedPath]?.[currentLanguage] ||
      defaultPlaceholder?.[currentLanguage] ||
      '';

    const showOnEmptyLine: boolean = (placeholders?.[openedPath]
      ?.showOnEmptyLine ??
      defaultPlaceholder?.showOnEmptyLine ??
      false) as boolean;
    if (placeholderText) {
      return [
        placeholderTheme,
        placeholderLinePlugin(),
        placeholder(placeholderText as string | HTMLElement, showOnEmptyLine),
      ];
    }
    return [];
  };

  const create = (v: EditorView) => {
    const dom = document.createElement('div');
    return { dom };
  };

  const extensions = useMemo(() => {
    const plugins = [] as any;
    if (!isPlayBack) {
      // eslint-disable-next-line
      plugins.push(readOnlyRangesExtension(getReadOnlyRanges));
    } else {
      plugins.push(lineHighlightCompartment.of([]));
    }

    return [
      ...debugBreakPoint(),
      ...getPlaceHolders(),
      gutterThemeAction.current.of([]),
      hotKeysAction.current.of([]),
      keywordHighlight.current.of([]),
      fontSizeSettings.current.of([]),
      reportHighlight.current.of([]),
      ...plugins,
      basicSetup(customkeys, lineGutter()),
      search({
        top: true,
      }),
      lintGutter({
        hoverTime: 100,
      }),
      linter(null, {
        delay: 0,
        markerFilter: null,
        tooltipFilter: null,
        autoPanel: false,
        filePath: openedPath,
        fixInChatCallback,
        view: rectEditorRef?.view,
      }),
      domEventHandlers(enableAction),
      indentUnitExtensions(Number(tabSize), indentMode),
      editorModeExtension(mode),
      ...commonExtensions,
      editorWordWrap ? EditorView.lineWrapping : [],
      animatableDiffViewCompartment.of(
        enableDiffView && originalContent != null
          ? animatableDiffView({
              original: originalContent,
              gutter: false,
              showTypewriterAnimation: enableDiffAnimation,
            })
          : [],
      ),
      cmdkInputCompartment.current.of(
        typeof cmdkCallback === 'function'
          ? cmdkInputCard({
              chat: cmdkCallback,
              filePath: openedPath,
            })
          : [],
      ),
      floatingToolbar({ addToChatCallback }),
      EditorState.tabSize.of(Number(tabSize)),
      // ...getLanguageExtensions(codeSnippet),
      // historyExtenstion,
      // collabAction.current.of([]),
      collabExtension,
      collabThemeAction.current.of([]),
      // ...getSnippetCompletion(codeSnippet),
      lspAction.current.of([]),
      enableAction.current.of([]),
      answerAreaAction.current.of([]),
      clickEventAction.current.of([]),
      blockquotePlugin,
      lineDecoratorPlugin(enableAction),
      ...getScrollPlugin(),
      syncViewScrollExtension,
      ...debugLineDecorator(),
      translationExtension,
      ...debugToolTip,
      activeLine.current.of([]),
      lineNumberThemeAction.current.of([]),
      ...editorPlugins,
      // wordHover,
      // lineNumberUpdateListener,
      paddingBottomPlugin(),
      codeNavBackwardForwardPlugin(),
      showMinimap.compute(['doc'], (state) => {
        return {
          create,
          /* optional */
          displayText: 'blocks',
          showOverlay: 'always',
          gutters: [{ 1: '#00FF00', 2: '#00FF00' }],
        };
      }),
    ];
  }, [
    isPlayBack,
    getPlaceHolders,
    tabSize,
    indentMode,
    mode,
    editorWordWrap,
    enableDiffView,
    originalContent,
    enableDiffAnimation,
    cmdkCallback,
    openedPath,
    collabExtension,
    translationExtension,
    editorPlugins,
    lineHighlightCompartment,
    addToChatCallback,
  ]);

  const operateOpenParams = useCallback(() => {
    // $ openFileParams存在数据，表示该文件有操作需要执行
    // tips: 执行文件是已打开文件, 如果是未打开文件在onUpdate才触发执行
    const view = rectEditorRef?.view;
    const {
      lineNumber,
      isCurrentOpenFile,
      actions: action,
      insertCodeOptions,
    } = openFileParams;
    if (view && isCurrentOpenFile) {
      const { state } = view;

      if (
        lineNumber &&
        action === 'stackJump' &&
        !illegalLines(lineNumber, state.doc.lines)
      ) {
        // $ 堆栈跳转
        const docPosition = state.doc.line(lineNumber).from;
        view.dispatch({
          selection: { anchor: docPosition, head: docPosition },
          effects: [EditorView.scrollIntoView(docPosition, { y: 'center' })],
          userEvent: SCROLL_BY_LINE_USER_EVENT,
        });
      } else if (action === 'insertCode') {
        // $ 插入代码
        const { line, text, actions: insertAction } = insertCodeOptions!;
        let insertPos = state.selection.main.head;
        const insertline = state.doc.lineAt(insertPos);
        if (insertAction === 'start') {
          insertPos = insertline.from;
        } else if (insertAction === 'end') {
          insertPos = insertline.to;
        }
        const newlineDelimiter = /\\r?\\n|\\r|\\n/g;
        const textArr = decodeURI(text).split(newlineDelimiter) || [];
        const changes = {
          from: insertPos,
          insert: Text.of(textArr),
        };
        const tr = state.update({ changes });
        const anchor = tr.state.doc.line(line).to;
        // $ 编辑器先要聚焦，要不然光标不会聚焦
        if (!disableEditable && editable) {
          view.focus();
        }
        view.dispatch({
          changes: {
            from: insertPos,
            insert: Text.of(textArr),
          },
          selection: {
            anchor,
            head: anchor,
          },
          effects: [EditorView.scrollIntoView(anchor, { y: 'center' })],
          userEvent: CUSTOMIZE_INSERT_CODE_EVENT,
        });
      }

      actions.file.openFileParams({});
    }
  }, [disableEditable, editable, openFileParams, rectEditorRef?.view]);

  useEffect(() => {
    const view = rectEditorRef?.view;

    view?.dispatch({
      effects: [
        enableAction.current.reconfigure([
          EditorView.editable.of(!isReadonly),
          EditorState.readOnly.of(isReadonly),
        ]),
      ],
    });
  }, [isReadonly, rectEditorRef?.view]);

  // *********************
  // Life Cycle Function
  // *********************

  useEffect(() => {
    if (deletedPath) {
      Object.keys(props.editorHistoryState.current).map((path) => {
        // 如果删除的是文件夹，那么以删除路径开头的路径对应的所有缓存都要清空
        if (path.indexOf(deletedPath) === 0) {
          delete props.editorHistoryState.current[path];
        }
      });
      actions.file.deletedPath('');
    }
  }, [deletedPath, props.editorHistoryState]);

  useEffect(() => {
    operateOpenParams();
  }, [operateOpenParams]);

  /**
   * 关键字全局搜索完毕后动态更新插件配置，使编辑区内的文件内容中的关键字高亮:
   * 1. 自定义插件 highLightKeywordPlugin 设置高亮效果;
   * 2. 当选中查询结果中的某一行时，滚到到该行;
   * 3. plugins 为 [] 则不设置高亮 or 还原，只有设置关键词高亮时才需增加滚动 effect;
   * 4. 当前选中行的关键词的高亮效果为 brightStyle，其余则为 normalStyle;
   */
  useEffect(() => {
    const view = rectEditorRef?.view;
    const { keyword, isPreciseCase, isShow, line } = searchKeywordInfo;

    if (view) {
      const normalizedKeyword = keyword
        ? keyword.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1')
        : '';
      const plugins =
        !isShow || !keyword
          ? []
          : [
              highLightKeywordPlugin(
                new RegExp(normalizedKeyword, isPreciseCase ? 'g' : 'ig'),
                line,
              ),
            ];

      const effects = [keywordHighlight.current.reconfigure(plugins)];
      plugins.length && line && effects.push(EditorView.scrollIntoView(line));
      view.dispatch({ effects });
    }
  }, [searchKeywordInfo, rectEditorRef?.view]);

  // *********************
  // Sevice Funtion
  // *********************

  // 文件不可编辑给予提示
  const disableEditorPrompt = () => {
    const editorEnable = !disableEditable && editable;
    if (!editorEnable && !isPlayBack) {
      MessageComp.error(t('editor_file_is_not_editable'));
    }
  };

  // 设置编辑器光标位置
  const setEditorSelection = (view: EditorView) => {
    view.focus(); // 自动聚焦
    const lines = view.state.doc.lines; // 获取当前打开文件的总行数
    const payload = { openPath: store.file.getOpenedPath() };

    let position = store.config.focusEditorPosition(); // 获取全局配置信息中的位置数据
    let targetLine = view.state.doc.line(lines); // 获取最后一行的行数据

    // position 默认值为 TOP，若为其他值，编辑器需自动滚动到光标所在位置
    if (position === 'TOP') {
      triggerMessage(Messages.FileOpenDone, payload);
      return;
    }

    // 指定行数时，不能超出最大行数
    if (position !== 'BOTTOM') {
      position = position > lines ? lines : position;
      targetLine = view.state.doc.line(position);
    }

    view.dispatch({
      selection: { anchor: targetLine.to, head: targetLine.to }, // 设置光标位置
      effects: [
        EditorView.scrollIntoView(targetLine.from, {
          y: 'center',
        }), // 编辑器滚动，光标居中显示
        // $ 在domEventHandlersPlugin -> freezeCode 会把editable设置为false情况，这里为了光标聚焦需要设置成true
        enableAction.current.reconfigure([EditorView.editable.of(true)]),
      ],
    });
    triggerMessage(Messages.FileOpenDone, payload);
  };

  // 设置高亮缓存数据
  const setHighlightData = (view: EditorView) => {
    const reportHighlightData = store.file.reportHighlightData();
    if (!reportHighlightData) return;

    const { openedPath } = store.file.doc();

    if (!reportHighlightData.cache) {
      reportHighlightData.cache = {} as ReportHighlightCache;
    }

    // 打开的文件的高亮数据
    const openedFileHighlightData = reportHighlightData.list.filter(
      (item) => item.path === openedPath,
    );

    // reportHighlightData.cache 中没有找到打开文件的高亮数据时，存入数据
    if (
      openedFileHighlightData.length > 0 &&
      !reportHighlightData.cache[openedPath]
    ) {
      const docArray = view.state.doc.toJSON();
      reportHighlightData.cache[openedPath] =
        openedFileHighlightData[0].arr.map((line) => {
          return {
            line,
            text: docArray[line - 1],
            pasteText: docArray[line - 1],
          };
        });
    }
  };

  // 设置行高亮效果
  const setHighlightEffect = (
    view: EditorView,
    isUpdate?: boolean,
    path?: string,
    cache?: ReportHighlightCache,
  ) => {
    const filePath = path || store.file.getOpenedPath();
    const data = cache || store.file.reportHighlightData()?.cache;
    if (!data || !filePath) return;

    let list = data[filePath] || [];

    if (isUpdate) {
      list = updateLineHighlightData(view, list);
      data[filePath] = list;
    }

    list.length &&
      view.dispatch({
        effects: reportHighlight.current.reconfigure([
          reportHighlightPlugin(list.map((item) => item.line)),
          divideLinePlugin({ changesList: list, cheatList: [] }),
        ]),
      });
  };

  // 编辑器实例化完成后触发的回调
  const initEditor = (view: EditorView | undefined) => {
    actions.file.editorView(view);
    if (view) {
      setEditorSelection(view);
      setHighlightData(view);
      setHighlightEffect(view);
    }
  };

  // 发送全局 Message
  const triggerMessage = (name: string, payload?: any) => {
    store.dao.channel().trigger(name, { name, payload });
  };

  const onUpdate = (viewUpdate: ViewUpdate) => {
    const { lineNumber, isCurrentOpenFile } = store.file.openFileParams();
    const { state, view, transactions: trs } = viewUpdate;
    const tr = trs[0];
    if (isVirtualUser) {
      channel.trigger('followingFocusComponentUpdate', {
        name: 'followingFocusComponentUpdate',
        payload: {
          type: 'Editor',
        },
      });
    }
    if (tr && tr.isUserEvent('editor.activeLine')) {
      return;
    }

    const { from, to } = viewUpdate.view.state.selection.main;

    // 还需要判断是代码标识行
    if (from === to) {
      const line = viewUpdate.view.state.doc.lineAt(from);
      const aiCodeInfo = store.file.aiCodeInfo();
      const targetItem = aiCodeInfo.find((item) => {
        return item.from === line.number;
      });
      if (!targetItem) {
        viewUpdate.view.dispatch({
          effects: activeLine.current.reconfigure([
            highlightActiveLine(),
            highlightActiveLineGutter(),
          ]),
          annotations: Transaction.userEvent.of('editor.activeLine'),
        });
      } else {
        viewUpdate.view.dispatch({
          effects: activeLine.current.reconfigure([
            // highlightActiveLine(),
            highlightActiveLineGutter(),
          ]),
          annotations: Transaction.userEvent.of('editor.activeLine'),
        });
      }
    } else {
      viewUpdate.view.dispatch({
        effects: activeLine.current.reconfigure([]),
        annotations: Transaction.userEvent.of('editor.activeLine'),
      });
    }
    // $ openFileParams存在数据，表示有操作需要执行在渲染完成之后
    if (lineNumber && !isCurrentOpenFile) {
      if (
        !illegalLines(lineNumber, state.doc.lines) &&
        !tr?.isUserEvent(SCROLL_BY_LINE_USER_EVENT)
      ) {
        const docPosition = state.doc.line(lineNumber).from;
        view.dispatch({
          selection: { anchor: docPosition, head: docPosition },
          effects: [EditorView.scrollIntoView(docPosition, { y: 'center' })],
          userEvent: SCROLL_BY_LINE_USER_EVENT,
        });
      }
      actions.file.openFileParams({});
    }

    // Update diff block info when document changes or selection changes
    if (
      showDiffWithSnapshot &&
      (viewUpdate.docChanged || viewUpdate.selectionSet)
    ) {
      // Add a small delay to ensure diff view has time to update chunks
      setTimeout(() => {
        updateDiffBlockInfo(viewUpdate.view);
      }, 0);
    }
  };

  // 每次编辑器文本内容发生变化时触发
  const onChange = (text: string, viewUpdate: ViewUpdate) => {
    setHighlightEffect(viewUpdate.view, true);
    // Update diff block info when editor content changes

    // Add a small delay to ensure diff view has time to update chunks
    setTimeout(() => {
      updateDiffBlockInfo(viewUpdate.view);
    }, 0);
  };

  // *********************
  // DiffToolbar
  // *********************
  const dockerId = store.dao.playgroundInfo().dockerId;
  const [isShowDiffToolbar, setIsShowDiffToolbar] = useState(false);
  const [isShowRegenModal, setShowRegenModal] = useState(false);
  const editorLayoutRef = useRef<HTMLDivElement | null>(null);
  const [currentSnapshot, setCurrentSnapshot] = useState<any | null>(null);
  const [nextSnapshot, setNextSnapshot] = useState<any | null>(null);

  const [actionsInfo, setActionsInfo] = useState<any[] | null>(null);

  // Diff block navigation state
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);

  const shouldShowDiffToolbar = useMemo(() => {
    return (
      enableDiffView &&
      !isReadonly &&
      (currentActionIndex === currentOpenActionIndex ||
        (currentActionIndex === -1 && currentOpenActionIndex === 0))
    );
  }, [enableDiffView, isReadonly, currentActionIndex, currentOpenActionIndex]);

  const currentActionInfo = useMemo(() => {
    if (!diffToolbarData) return null;
    const newIndex = currentActionIndex > 0 ? currentActionIndex : 0;
    return diffToolbarData.actionsInfo[newIndex];
  }, [currentActionIndex, diffToolbarData]);

  useEffect(() => {
    if (!diffToolbarData || !dockerId) {
      setCurrentSnapshot(null);
      return;
    }

    const { snapshotFrames } = diffToolbarData;
    if (!snapshotFrames) {
      setCurrentSnapshot(null);
      return;
    }
    if (currentActionIndex > 0 && actionsInfo) {
      let revertIdx = -1;
      for (let i = currentActionIndex - 1; i > -1; i--) {
        if (actionsInfo[i].status === 'completed') {
          revertIdx = i;
          break;
        }
      }

      if (snapshotFrames[revertIdx]) {
        const snapshotKey = getLastSnapshotKey(
          dockerId,
          snapshotFrames[revertIdx].value.path,
          snapshotFrames[revertIdx].uuid,
        );

        getSnapshot(snapshotKey)
          .then((currentSnapshotValue) => {
            if (currentSnapshotValue) {
              setCurrentSnapshot({
                ...snapshotFrames[currentActionIndex],
                value: {
                  ...snapshotFrames[currentActionIndex].value,
                  content: String(currentSnapshotValue),
                },
              });
            } else {
              setCurrentSnapshot(snapshotFrames[currentActionIndex]);
            }
          })
          .catch((e) => {
            logger.error('getSnapshot error', e);
          });
        return;
      } else {
        setCurrentSnapshot(snapshotFrames[currentActionIndex]);
        return;
      }
    }

    if (currentActionIndex < 0) {
      setCurrentSnapshot(null);
      return;
    }
    setCurrentSnapshot(snapshotFrames[currentActionIndex]);
  }, [
    currentActionIndex,
    diffToolbarData,
    shouldSaveSnapshot,
    actionsInfo,
    dockerId,
  ]);

  useEffect(() => {
    if (!diffToolbarData) {
      setNextSnapshot(null);
      return;
    }

    const { snapshotFrames } = diffToolbarData;
    if (!snapshotFrames || !actionsInfo) {
      setNextSnapshot(null);
      return;
    }

    let restoreIdx = -1;
    for (let i = currentActionIndex + 1; i < actionsInfo.length; i++) {
      if (actionsInfo[i].status === 'canceled') {
        restoreIdx = i;
        break;
      }
    }
    if (
      (actionsInfo[restoreIdx] &&
        actionsInfo[restoreIdx].status === 'in_progress') ||
      !snapshotFrames[restoreIdx] ||
      !dockerId
    ) {
      setNextSnapshot(null);
      return;
    }

    if (!snapshotFrames[restoreIdx]) {
      setNextSnapshot(null);
      return;
    }

    const snapshotKey = getLastSnapshotKey(
      dockerId,
      snapshotFrames[restoreIdx].value.path,
      snapshotFrames[restoreIdx].uuid,
    );
    getSnapshot(snapshotKey)
      .then((nextSnapshotValue) => {
        if (nextSnapshotValue) {
          setNextSnapshot({
            ...snapshotFrames[restoreIdx],
            value: {
              ...snapshotFrames[restoreIdx].value,
              content: String(nextSnapshotValue),
            },
          });
        } else if (restoreIdx < snapshotFrames.length - 1) {
          if (!snapshotFrames[restoreIdx + 1]) {
            setNextSnapshot(null);
            return;
          }
          setNextSnapshot({
            ...snapshotFrames[restoreIdx],
            value: {
              ...snapshotFrames[restoreIdx].value,
              content: snapshotFrames[restoreIdx + 1].value.content,
            },
          });
        } else {
          setNextSnapshot(null);
        }
      })
      .catch((e) => {
        logger.error('getSnapshot error', e);
      });
  }, [
    currentActionIndex,
    diffToolbarData,
    dockerId,
    shouldSaveSnapshot,
    actionsInfo,
  ]);

  // Update diff block information
  const updateDiffBlockInfo = (view: EditorView) => {
    const chunks = getChunks(view.state);
    if (chunks && chunks.chunks.length > 0) {
      setTotalChunks(chunks.chunks.length);
      const currentIndex = getCurrentChunkIndex(view.state);
      setCurrentChunkIndex(currentIndex);
    } else {
      setTotalChunks(0);
      setCurrentChunkIndex(0);
    }
  };

  // Navigate to specific diff block
  const handleNavigateToChunk = (chunkIndex: number) => {
    if (!rectEditorRef?.view) return;

    const success = goToChunk(chunkIndex)({
      state: rectEditorRef.view.state,
      dispatch: rectEditorRef.view.dispatch,
    });

    if (success) {
      setCurrentChunkIndex(chunkIndex);
    }
  };

  // Auto-navigate to nearest diff block when DiffToolbar is shown (without scrolling)
  useEffect(() => {
    if (isShowDiffToolbar && rectEditorRef?.view) {
      const view = rectEditorRef.view;
      const chunks = getChunks(view.state);
      if (chunks && chunks.chunks.length > 0) {
        const nearestIndex = getCurrentChunkIndex(view.state);
        // Only update the currentChunkIndex without scrolling
        setCurrentChunkIndex(nearestIndex);
      }
    }
  }, [isShowDiffToolbar, rectEditorRef?.view]);

  const dispatchUpdateOriginalDoc = (view: EditorView, snapshot: string) => {
    const content = snapshot || '\n'; // 确保至少有一个换行符
    const changes = ChangeSet.of(
      {
        from: 0,
        to: content.length,
        insert: content,
      },
      content.length,
    );
    view.dispatch({
      effects: [
        updateOriginalDoc.of({
          doc: Text.of(content.split(/\r?\n/)),
          changes,
        }),
      ],
    });
    // 等待下一个 tick 确保 diff 视图已更新
    setTimeout(() => {
      const chunks = getChunks(view.state);
      if (chunks && chunks.chunks.length > 0) {
        const pos = chunks.chunks[0].fromB;
        view.dispatch({
          effects: [EditorView.scrollIntoView(pos, { y: 'center' })],
        });
        // Update diff block info after diff view is updated
        updateDiffBlockInfo(view);
      }
    }, 0);
  };

  useEffect(() => {
    const view = rectEditorRef?.view;
    if (!diffToolbarData || !view) return;
    const { snapshotFrames } = diffToolbarData;
    if (!snapshotFrames) return;

    const snapshot = snapshotFrames[currentOpenActionIndex];
    if (snapshot) {
      dispatchUpdateOriginalDoc(view, snapshot.value.content);
    }
    if (!dockerId) return;
    const snapshotIndex =
      currentOpenActionIndex > 0 ? currentOpenActionIndex : 0;
    const snapshotKey = getLastSnapshotKey(
      dockerId,
      snapshotFrames[snapshotIndex].value.path,
      snapshotFrames[snapshotIndex].uuid,
    );

    getSnapshot(snapshotKey)
      .then((snapshotContent) => {
        if (snapshotContent && Object.keys(snapshotContent).length > 0) {
          setSnapshotContent(String(snapshotContent));
        }
      })
      .catch((e) => {
        logger.error('getSnapshot error', e);
      });
  }, [currentOpenActionIndex, diffToolbarData, rectEditorRef?.view]);

  useEffect(() => {
    if (diffToolbarData) {
      setCurrentOpenActionIndex(diffToolbarData.openActionIndex);
      const actionsInfo = diffToolbarData.actionsInfo;
      const lastCompletedIndex = actionsInfo.findLastIndex(
        (action: any) => action.status === 'completed',
      );
      setCurrentActionIndex(lastCompletedIndex);

      setActionsInfo(diffToolbarData.actionsInfo);
    }
  }, [diffToolbarData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        rectEditorRef?.view &&
        editorLayoutRef.current &&
        !editorLayoutRef.current.contains(event.target as Node)
      ) {
        setIsShowDiffToolbar(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    // 为每个文件下面添加空行
    if (rectEditorRef?.view) {
      rectEditorRef.view.dispatch({
        effects: [addPaddingBottom.of(null)],
        annotations: [Transaction.addToHistory.of(false)],
      });
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [rectEditorRef?.view]);

  // 保存最后一个action执行的快照
  useEffect(() => {
    const view = rectEditorRef?.view;

    if (shouldSaveSnapshot) {
      const actionsInfo = diffToolbarData?.actionsInfo;
      if (!actionsInfo || actionsInfo.length < 1) return;
      const lastSnapshotUUID =
        actionsInfo[actionsInfo.length - 1].action_object.snapshot_uuid;
      if (!lastSnapshotUUID || !view || !dockerId) return;
      const editorContent = view.state.doc.toString();
      saveLastSnapshotChange(
        dockerId,
        doc.openedPath,
        lastSnapshotUUID,
        editorContent,
      ).then(() => {
        setShouldSaveSnapshot(false);
      });
    }
  }, [
    rectEditorRef?.view,
    doc.openedPath,
    shouldSaveSnapshot,
    diffToolbarData,
    dockerId,
  ]);

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const isInToolModalWidget =
      (e.target as HTMLElement).closest('.tool-modal-widget') !== null;
    if (isInToolModalWidget) return;

    const isToolModalVisible =
      document.querySelector('.tool-modal-widget') !== null;

    const isLintTooltipVisible = document.querySelector('.cm-tooltip') !== null;
    if (isToolModalVisible || isLintTooltipVisible) return;

    if (disableEditable) return;

    setIsShowDiffToolbar(true);
  };

  const changeCurrentActionIdx = (type: 'revert' | 'restore') => {
    if (!actionsInfo) return;

    if (type === 'revert') {
      let revertIdx = -1;
      for (let i = currentActionIndex - 1; i > -1; i--) {
        if (actionsInfo[i].status === 'completed') {
          revertIdx = i;
          break;
        }
      }
      setCurrentActionIndex(revertIdx);
      setCurrentOpenActionIndex(revertIdx);
      const newActionsInfo = actionsInfo.map((action, index) => {
        if (index === currentActionIndex) {
          return {
            ...action,
            status: 'canceled',
          };
        } else {
          return action;
        }
      });
      setActionsInfo(newActionsInfo);
    }
    if (type === 'restore') {
      let restoreIdx = -1;
      for (let i = currentActionIndex + 1; i < actionsInfo.length; i++) {
        if (actionsInfo[i].status === 'canceled') {
          restoreIdx = i;
          break;
        }
      }
      setCurrentActionIndex(restoreIdx);
      setCurrentOpenActionIndex(restoreIdx);
      const newActionsInfo = actionsInfo.map((action, index) => {
        if (index === restoreIdx) {
          return {
            ...action,
            status: 'completed',
          };
        } else {
          return action;
        }
      });
      setActionsInfo(newActionsInfo);
    }
  };

  const needRevert = useStore().file.needRevert();
  const needRestore = useStore().file.needRestore();
  useEffect(() => {
    if (needRevert && currentSnapshot && rectEditorRef?.view) {
      executeRevert();
      actions.file.setNeedRevert(false);
    }
  }, [needRevert, currentSnapshot, rectEditorRef?.view]);

  const executeRevert = () => {
    revertAIChange(
      rectEditorRef?.view,
      currentSnapshot,
      changeCurrentActionIdx,
      historyLength,
      setHistoryLength,
      revertRestoreDialogCallback,
      revertRestoreCallback,
    );
  };

  const executeRestore = () => {
    restoreAIChange(
      rectEditorRef?.view,
      nextSnapshot,
      changeCurrentActionIdx,
      historyLength,
      setHistoryLength,
      revertRestoreDialogCallback,
      revertRestoreCallback,
    );
  };

  useEffect(() => {
    if (needRestore && nextSnapshot && rectEditorRef?.view) {
      executeRestore();
      actions.file.setNeedRestore(false);
    }
  }, [needRestore, nextSnapshot, rectEditorRef?.view]);

  // *********************
  // View
  // *********************

  const editorContent = useMemo(() => {
    if (showDiffWithSnapshot && snapshotContent) {
      return snapshotContent;
    }
    return content;
  }, [showDiffWithSnapshot, snapshotContent, content]);

  if (!openedPath) return null;
  const containerClassName =
    !disableEditable && editable
      ? 'd42-editor-container'
      : 'd42-editor-container d42-editor-readonly';

  return enableDiffView == null ? (
    <CodeLoader />
  ) : (
    <CodeEditorLayout
      ref={editorLayoutRef}
      className="d42-code-editor-layout"
      data-testid="code-editor"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        disableEditorPrompt();
        handleEditorClick(e); // 调用点击处理函数
      }}
    >
      <div className="editor-with-toolbar">
        {isShowRegenModal && (
          <RegenerateModal
            regenerateInfo={currentActionInfo}
            setIsShowDiffToolbar={setIsShowDiffToolbar}
            setShowRegenModal={setShowRegenModal}
            regenerateCallback={regenerateCallback || null}
          />
        )}
        {shouldShowDiffToolbar && isShowDiffToolbar && (
          <DiffToolbar
            currentSnapshot={currentSnapshot}
            nextSnapshot={nextSnapshot}
            setIsShowDiffToolbar={setIsShowDiffToolbar}
            setShowRegenModal={setShowRegenModal}
            executeRevert={executeRevert}
            executeRestore={executeRestore}
            currentChunkIndex={currentChunkIndex}
            totalChunks={totalChunks}
            onNavigateToChunk={handleNavigateToChunk}
          />
        )}
        <div
          className={`d42-editor-container ${
            isReadonly ? 'd42-editor-readonly' : ''
          }`}
        >
          <CodeMirrorEditor
            contextMenuConfig={contextMenu}
            basicSetup={false}
            ref={editorRef}
            key={openedPath}
            value={editorContent}
            theme="dark"
            className={containerClassName}
            extensions={extensions}
            editable={editorEnable}
            readOnly={isReadonly}
            indentWithTab={false}
            // TODO 记住undo， redo的新方案，暂时不上
            // initialState={
            //   props.editorHistoryState.current[openedPath]
            //     ? props.editorHistoryState.current[openedPath]
            //     : undefined
            // }
            onUpdate={onUpdate}
            onChange={onChange}
            setEditorView={initEditor}
            data-testid="codemirror-react"
          />
        </div>
      </div>
    </CodeEditorLayout>
  );
});

CodeEditor.displayName = 'CodeEditor';
