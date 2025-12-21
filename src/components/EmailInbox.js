"use client";
import { useState, memo, useEffect } from 'react';

const fmtMoney = (n) => {
  if (typeof n !== 'number') return "$0"; 
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
};

const EmailInbox = memo(({ emails, ledger, selectedEmail, onSelectEmail, onCloseEmail, onHire, onReject, onFire, unreadEmails, unreadLedger, onMarkEmailsViewed, onMarkLedgerViewed }) => {
  const [activeTab, setActiveTab] = useState('INBOX');

  // Mark all emails as viewed when user opens inbox tab
  useEffect(() => {
    if (activeTab === 'INBOX' && emails.length > 0 && onMarkEmailsViewed) {
      onMarkEmailsViewed(emails.length);
    }
  }, [activeTab, emails.length, onMarkEmailsViewed]);

  // Mark all ledger items as viewed when user opens ledger tab
  useEffect(() => {
    if (activeTab === 'LEDGER' && ledger.length > 0 && onMarkLedgerViewed) {
      onMarkLedgerViewed(ledger.length);
    }
  }, [activeTab, ledger.length, onMarkLedgerViewed]);

  return (
    <div className="md:col-span-4 flex flex-col border border-gray-800 bg-gray-900/40 rounded h-full overflow-y-auto md:overflow-hidden" data-tutorial="email-inbox">
      <div className="flex border-b border-gray-800 shrink-0">
        <button onClick={() => setActiveTab('INBOX')} className={`flex-1 py-3 text-xs font-bold transition-colors relative ${activeTab === 'INBOX' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
          INBOX
          {unreadEmails > 0 && (
            <span className="absolute top-1.5 right-2 bg-red-600 text-white rounded-full min-w-[20px] h-5 px-1.5 text-[10px] font-bold flex items-center justify-center animate-pulse shadow-lg shadow-red-600/50">
              {unreadEmails}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab('LEDGER')} className={`flex-1 py-3 text-xs font-bold transition-colors relative ${activeTab === 'LEDGER' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
          FIRM LEDGER
          {unreadLedger > 0 && (
            <span className="absolute top-1.5 right-2 bg-red-600 text-white rounded-full min-w-[20px] h-5 px-1.5 text-[10px] font-bold flex items-center justify-center animate-pulse shadow-lg shadow-red-600/50">
              {unreadLedger}
            </span>
          )}
        </button>
      </div>
      {activeTab === 'INBOX' && (
        <>
          {/* LIST VIEW */}
          <div className="flex-grow md:flex-grow overflow-y-auto min-h-0">
            {(emails || []).length === 0 && <div className="p-8 text-center text-gray-600 text-xs italic">Inbox empty...</div>}
            
            {(emails || []).map((email) => {
              const isRead = email.read || false;
              const isSelected = selectedEmail?.id === email.id;
              
              return (
                <div 
                  key={email.id} 
                  onClick={() => onSelectEmail(email)} 
                  className={`p-3 border-b border-gray-800 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-amber-900/20 border-l-2 border-l-amber-500' 
                      : isRead 
                        ? 'hover:bg-gray-800/50 opacity-60' 
                        : 'hover:bg-gray-800 bg-gray-900/30'
                  }`}
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-bold flex items-center gap-1.5 ${email.type === 'alert' ? 'text-red-500' : isRead ? 'text-gray-400' : 'text-white'}`}>
                      {email.sender}
                      {!isRead && <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full"></span>}
                    </span>
                    <span className={`text-[9px] ${isRead ? 'text-gray-600' : 'text-gray-500'}`}>{email.date}</span>
                  </div>
                  <div className={`text-[10px] truncate font-bold ${isRead ? 'text-gray-500' : 'text-gray-300'}`}>{email.subject}</div>
                </div>
              );
            })}
          </div>

          {/* DETAIL VIEW (Bottom Pane) */}
          {selectedEmail && (
            <div className="shrink-0 border-t border-amber-500/30 bg-black p-4 animate-in slide-in-from-bottom-2 relative">
               {/* Close Button */}
               <button 
                 onClick={onCloseEmail}
                 className="absolute top-2 right-2 text-gray-500 hover:text-white text-lg font-bold w-6 h-6 flex items-center justify-center"
                 aria-label="Close email"
               >
                 ×
               </button>
               
               {/* 1. RECRUITMENT EMAIL VIEW */}
               {selectedEmail.type === 'recruitment' ? (
                 <>
                   {/* Headhunter Message */}
                   <div className="text-xs text-gray-400 mb-3 italic border-l-2 border-amber-800 pl-2 pr-6">
                     {selectedEmail.body.split('---')[0].trim()}
                   </div>
                   
                   {/* Candidate Name & Specialism */}
                   <div className="mb-2">
                     <div className="text-sm font-bold text-white">{selectedEmail.data.name}</div>
                     <div className="text-xs text-amber-500 uppercase tracking-wider">{selectedEmail.data.specialism}</div>
                   </div>
                   
                   {/* Bio - Moved here under name/specialism */}
                   <div className="mb-3 text-xs text-gray-500 italic border-l-2 border-gray-700 pl-2">
                     "{selectedEmail.data.bio}"
                   </div>
                   
                   {/* Performance Metrics Table */}
                   <div className="mb-3 bg-gray-900/30 border border-gray-700 p-2 rounded">
                     <div className="text-[10px] text-amber-500 uppercase mb-2 font-bold">PERFORMANCE</div>
                     <div className="grid grid-cols-2 gap-2 text-xs">
                       <div>
                         <div className="text-gray-500 text-[10px]">Alpha</div>
                         <div className="text-white font-bold">{selectedEmail.data.stats.alpha_display}</div>
                       </div>
                       <div>
                         <div className="text-gray-500 text-[10px]">Beta</div>
                         <div className="text-white font-bold">{selectedEmail.data.stats.beta}</div>
                       </div>
                       <div>
                         <div className="text-gray-500 text-[10px]">Drawdown</div>
                         <div className="text-white font-bold">{selectedEmail.data.stats.last_drawdown}</div>
                       </div>
                       <div>
                         <div className="text-gray-500 text-[10px]">Lifetime PnL</div>
                         <div className="text-white font-bold">{selectedEmail.data.stats.lifetime_pnl}</div>
                       </div>
                     </div>
                   </div>
                   
                   {/* Compensation Table */}
                   <div className="mb-3 bg-gray-900/30 border border-gray-700 p-2 rounded">
                     <div className="text-[10px] text-amber-500 uppercase mb-2 font-bold">COMPENSATION</div>
                         <div className="grid grid-cols-2 gap-2 text-xs">
                           <div>
                             <div className="text-gray-500 text-[10px]">Sign-on Bonus</div>
                             <div className="text-white font-bold">
                               {fmtMoney(selectedEmail.data.demands.signing_bonus)}
                             </div>
                           </div>
                           <div>
                             <div className="text-gray-500 text-[10px]">Annual Salary</div>
                             <div className="text-white font-bold">
                               {fmtMoney(selectedEmail.data.demands.salary)}
                             </div>
                           </div>
                       <div className="col-span-2">
                         <div className="text-gray-500 text-[10px]">Performance Cut</div>
                         <div className="text-white font-bold">{selectedEmail.data.demands.pnl_cut}%</div>
                       </div>
                     </div>
                   </div>
                   
                   {/* Action Buttons */}
                   <div className="flex gap-2">
                     <button onClick={() => onHire(selectedEmail.id)} className="flex-1 bg-green-900/20 text-green-500 border border-green-800 py-2 text-xs font-bold hover:bg-green-900/40 transition-colors">HIRE</button>
                     <button onClick={() => onReject(selectedEmail.id)} className="flex-1 bg-red-900/20 text-red-500 border border-red-800 py-2 text-xs font-bold hover:bg-red-900/40 transition-colors">REJECT</button>
                   </div>
                 </>
               ) : (selectedEmail.type === 'alert' && selectedEmail.data?.action === 'drawdown_warning') || 
                    (selectedEmail.type === 'alert' && selectedEmail.requires_response && selectedEmail._message_template?.impact?.user_action?.fire) ? (
               
               /* 2. DRAWDOWN WARNING EMAIL VIEW */
                 <>
                   <div className="text-sm font-bold text-red-500 mb-1 pr-6">
                     {selectedEmail.subject}
                   </div>
                   <div className="text-xs text-gray-400 mb-4 whitespace-pre-wrap leading-relaxed border-l-2 border-red-800 pl-2">
                     {selectedEmail.body}
                   </div>
                   <div className="flex gap-2">
                         <button 
                           onClick={() => onFire(selectedEmail.id)} 
                           className="flex-1 bg-red-900/20 text-red-500 border border-red-800 py-2 text-xs font-bold hover:bg-red-900/40"
                         >
                           FIRE POD
                         </button>
                     <button 
                       onClick={() => onReject(selectedEmail.id)} 
                       className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 py-2 text-xs font-bold hover:bg-gray-700"
                     >
                       DISMISS
                     </button>
                   </div>
                 </>
               ) : (
               
               /* 3. STANDARD EMAIL VIEW (including award emails) */
                 <>
                   {/* Award Image Display */}
                   {selectedEmail.data?.award_image && (
                     <div className="mb-4 flex justify-center">
                       <img 
                         src={selectedEmail.data.award_image} 
                         alt={selectedEmail.data.award_name || 'Award'}
                         className="w-32 h-32 md:w-48 md:h-48 object-contain"
                         onError={(e) => {
                           // Fallback to SVG if PNG doesn't exist
                           e.target.src = selectedEmail.data.award_image.replace('.png', '.svg');
                         }}
                       />
                     </div>
                   )}
                   <div className={`text-sm font-bold mb-1 pr-6 ${selectedEmail.type === 'alert' ? 'text-red-500' : 'text-white'}`}>
                     {selectedEmail.subject}
                   </div>
                   <div className="text-xs text-gray-400 mb-4 whitespace-pre-wrap leading-relaxed border-l-2 border-gray-800 pl-2">
                     {selectedEmail.body}
                   </div>
                   <button 
                     onClick={() => {
                       onReject(selectedEmail.id); // Re-use reject to "delete" email
                     }} 
                     className="w-full bg-gray-800 text-gray-300 border border-gray-700 py-2 text-xs font-bold hover:bg-gray-700"
                   >
                     MARK AS READ (ARCHIVE)
                   </button>
                 </>
               )}
            </div>
          )}
        </>
      )}
      {activeTab === 'LEDGER' && (
         <div className="p-2 overflow-y-auto font-mono text-xs flex flex-col h-full bg-gray-900/20">
           <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-900"><tr className="text-gray-500 border-b border-gray-700"><th className="pb-2 pt-1 font-normal pl-2">Date</th><th className="pb-2 pt-1 font-normal">Desc</th><th className="pb-2 pt-1 font-normal text-right pr-2">Amt</th></tr></thead>
              <tbody>{(ledger || []).map((txn, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800">
                  <td className="py-2 text-gray-500 text-[10px] pl-2">{txn.date.split(' ').slice(0,2).join(' ')}</td>
                  <td className="py-2 text-gray-300">{txn.desc}</td>
                  <td className={`py-2 text-right pr-2 font-bold ${txn.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {fmtMoney(txn.amount)}
                  </td>
                </tr>
              ))}</tbody>
           </table>
         </div>
      )}
    </div>
  );
});

EmailInbox.displayName = 'EmailInbox';

export default EmailInbox;

