'use strict';
function isTrustedMainFrame(event, window, allowedUrl) {
  if (!window || window.isDestroyed() || !event || event.sender !== window.webContents ||
      event.senderFrame !== window.webContents.mainFrame) return false;
  return event.senderFrame.url === allowedUrl;
}
function matchesSelectedAccount(requested, selected, senderId, ownerId) {
  return Boolean(selected && requested === selected && senderId === ownerId);
}
module.exports = { isTrustedMainFrame, matchesSelectedAccount };
