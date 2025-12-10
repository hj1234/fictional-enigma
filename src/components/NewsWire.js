"use client";

const NewsWire = ({ logs, dateKey }) => {
  return (
    <div className="h-full border border-gray-800 bg-gray-900/40 rounded flex flex-col overflow-hidden" data-tutorial="news-wire">
       <h2 className="p-3 text-xs text-gray-400 border-b border-gray-800 shrink-0">NEWS WIRE</h2>
       <div className="p-2 overflow-y-auto font-mono text-xs flex flex-col gap-2 h-full">
         {logs.map((log, i) => (
           <div key={`log-${dateKey}-${i}`} className={`pl-2 border-l-2 ${log.type === 'danger' ? 'border-red-500 text-red-400 bg-red-900/10 p-1' : log.type === 'success' ? 'border-green-500 text-green-400 bg-green-900/10 p-1' : log.type === 'info' ? 'border-blue-500 text-blue-400' : 'border-gray-600 text-gray-500'}`}><span className="opacity-50 mr-2 text-[10px] uppercase">[{log.date}]</span><span>{log.text}</span></div>
         ))}
       </div>
    </div>
  );
};

export default NewsWire;

