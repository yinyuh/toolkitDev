import React, { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Share2, Link, Wifi, Contact, Smartphone, Mail, FileText, Image as ImageIcon, Settings, Check } from 'lucide-react';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

const QRCodeGenerator = () => {
  const [content, setContent] = useState('https://example.com');
  const [activeTab, setActiveTab] = useState('url');
  const [contentError, setContentError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalSize, setModalSize] = useState(256);
  const [isContentValid, setIsContentValid] = useState(true);
  
  // 不同类型内容的最大长度限制
  const MAX_LENGTHS = {
    url: 2300,      // 英文URL/文本
    text: 2300,     // 英文文本
    wifi: 500,      // WiFi信息
    vcard: 1000,    // 名片信息
    phone: 50,      // 电话号码
    email: 254      // 邮箱地址
  };
  
  // Customization
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(256);
  const [level, setLevel] = useState('M'); // L, M, Q, H
  const [includeLogo, setIncludeLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoSize, setLogoSize] = useState(24);

  // WiFi specific states
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);

  // VCard specific states
  const [vcardFirstName, setVcardFirstName] = useState('');
  const [vcardLastName, setVcardLastName] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');
  const [vcardOrg, setVcardOrg] = useState('');

  const qrRef = useRef(null);
  const modalQrRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Validate content length
  const validateContent = (value) => {
    const maxLength = MAX_LENGTHS[activeTab] || 2300;
    
    // 检测汉字数量（汉字在二维码中占用更多空间）
    const chineseCharCount = (value.match(/[\u4e00-\u9fa5]/g) || []).length;
    
    // 计算等效长度：每个汉字算作2个字符
    const effectiveLength = value.length + chineseCharCount;
    
    if (effectiveLength > maxLength) {
      setContentError(`内容过长！当前 ${value.length} 字符（含 ${chineseCharCount} 个汉字），最大支持 ${maxLength} 字符`);
      setIsContentValid(false);
      return false;
    } else {
      setContentError('');
      setIsContentValid(true);
      return true;
    }
  };
  
  const handleContentChange = (value) => {
    if (validateContent(value)) {
      setContent(value);
    }
  };
  
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -32 : 32;
    const newSize = Math.max(128, Math.min(1024, modalSize + delta));
    setModalSize(newSize);
  };

  // Update content based on active tab and inputs
  useEffect(() => {
    let newContent = '';
    
    switch (activeTab) {
      case 'url':
      case 'text':
      case 'phone':
      case 'email':
        // 对于这些类型，内容由输入直接管理
        break;
      case 'wifi':
        // WIFI:S:MySSID;T:WPA;P:MyPass;H:false;;
        const ssid = wifiSsid.replace(/([\\;,:])/g, '\\$1');
        const pass = wifiPassword.replace(/([\\;,:])/g, '\\$1');
        newContent = `WIFI:S:${ssid};T:${wifiEncryption};P:${pass};H:${wifiHidden};;`;
        if (validateContent(newContent)) {
          setContent(newContent);
        }
        break;
      case 'vcard':
        // Simple vCard 3.0
        newContent = `BEGIN:VCARD\nVERSION:3.0\nN:${vcardLastName};${vcardFirstName}\nFN:${vcardFirstName} ${vcardLastName}\nORG:${vcardOrg}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nEND:VCARD`;
        if (validateContent(newContent)) {
          setContent(newContent);
        }
        break;
    }
  }, [activeTab, wifiSsid, wifiPassword, wifiEncryption, wifiHidden, vcardFirstName, vcardLastName, vcardPhone, vcardEmail, vcardOrg]);

  // 当标签页切换时，重新验证当前内容
  useEffect(() => {
    validateContent(content);
  }, [activeTab]);

  const handleDownload = (format, useModal = false) => {
    if (!isContentValid) {
      alert('内容过长，无法生成二维码');
      return;
    }
    
    if (format === 'png') {
      // 使用html2canvas从现有的QRCodeCanvas生成高分辨率图片
      const qrElement = qrRef.current;
      if (qrElement) {
        // 临时增大二维码尺寸以获取高分辨率
        const originalSize = size;
        setSize(1024);
        
        // 等待DOM更新后再生成图片
        setTimeout(() => {
          html2canvas(qrElement, {
            scale: 2, // 提高分辨率
            useCORS: true,
            logging: false,
            backgroundColor: bgColor
          }).then((canvas) => {
            // 恢复原始尺寸
            setSize(originalSize);
            
            canvas.toBlob((blob) => {
              if (blob) {
                saveAs(blob, 'qrcode.png');
              } else {
                alert('生成二维码图片失败，请重试');
              }
            });
          }).catch((error) => {
            // 恢复原始尺寸
            setSize(originalSize);
            console.error('生成二维码时出错:', error);
            alert('生成二维码时出错，请重试');
          });
        }, 100);
      } else {
        alert('无法找到二维码元素，请重试');
      }
    } else if (format === 'svg') {
      alert("暂仅支持 PNG 下载");
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoUrl(e.target.result);
        setIncludeLogo(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'url', label: '网址/文本', icon: Link },
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'vcard', label: '名片', icon: Contact },
    // { id: 'phone', label: '电话', icon: Smartphone },
    // { id: 'email', label: '邮件', icon: Mail },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Configuration */}
        <div className="lg:col-span-7 space-y-6">
           {/* Tabs */}
           <div className="flex bg-div-secondary p-1 rounded-xl overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                        setActiveTab(tab.id);
                        if(tab.id === 'url') {
                          const newContent = 'https://';
                          if (validateContent(newContent)) {
                            setContent(newContent);
                          }
                        }
                        if(tab.id === 'wifi') {
                          const newContent = 'WIFI:S:;T:WPA;P:;;';
                          if (validateContent(newContent)) {
                            setContent(newContent);
                          }
                        }
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === tab.id 
                        ? 'bg-div-theme text-accent shadow-sm' 
                        : 'text-text-secondary hover:text-text-theme'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                )
              })}
           </div>

           {/* Input Forms */}
           <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme p-6">
              {activeTab === 'url' && (
                <div>
                   <label className="block text-sm font-medium text-text-secondary mb-2">网址或文本内容</label>
                   <textarea 
                      value={content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="w-full p-3 border border-border-theme rounded-lg bg-div-secondary focus:ring-2 focus:ring-accent outline-none h-32"
                      placeholder="https://example.com"
                   />
                   {contentError && (
                      <p className="mt-2 text-sm text-red-500">{contentError}</p>
                   )}
                   <p className="mt-1 text-xs text-text-secondary">
                     已使用 {content.length} 字符（含 {(content.match(/[\u4e00-\u9fa5]/g) || []).length} 个汉字） / 最大 {MAX_LENGTHS[activeTab] || 2300} 字符
                   </p>
                </div>
              )}

              {activeTab === 'wifi' && (
                <div className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">WiFi 名称 (SSID)</label>
                      <input 
                        type="text" 
                        value={wifiSsid}
                        onChange={(e) => setWifiSsid(e.target.value)}
                        className="w-full p-3 border border-border-theme rounded-lg bg-div-secondary focus:ring-2 focus:ring-accent outline-none"
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">密码</label>
                      <input 
                        type="text" 
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        className="w-full p-3 border border-border-theme rounded-lg bg-div-secondary focus:ring-2 focus:ring-accent outline-none"
                      />
                   </div>
                   {contentError && (
                      <p className="text-sm text-red-500">{contentError}</p>
                   )}
                   <p className="text-xs text-text-secondary">
                     当前内容长度: {content.length} 字符 / 最大 {MAX_LENGTHS[activeTab] || 500} 字符
                   </p>
                   <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-text-secondary mb-2">加密方式</label>
                        <select 
                          value={wifiEncryption}
                          onChange={(e) => setWifiEncryption(e.target.value)}
                          className="w-full p-3 border border-border-theme rounded-lg bg-div-secondary outline-none"
                        >
                           <option value="WPA">WPA/WPA2</option>
                           <option value="WEP">WEP</option>
                           <option value="nopass">无密码</option>
                        </select>
                      </div>
                      <div className="flex items-center pt-8">
                         <label className="flex items-center cursor-pointer gap-2">
                            <input 
                              type="checkbox" 
                              checked={wifiHidden}
                              onChange={(e) => setWifiHidden(e.target.checked)}
                              className="w-4 h-4 text-accent rounded border-border-theme"
                            />
                            <span className="text-sm text-text-secondary">隐藏网络</span>
                         </label>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'vcard' && (
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">姓</label>
                        <input type="text" value={vcardLastName} onChange={(e) => setVcardLastName(e.target.value)} className="w-full p-3 border border-border-theme rounded-lg bg-div-secondary outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">名</label>
                        <input type="text" value={vcardFirstName} onChange={(e) => setVcardFirstName(e.target.value)} className="w-full p-3 border border-border-theme rounded-lg bg-div-secondary outline-none" />
                      </div>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">公司/组织</label>
                      <input type="text" value={vcardOrg} onChange={(e) => setVcardOrg(e.target.value)} className="w-full p-3 border border-border-theme rounded-lg bg-div-secondary outline-none" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">电话</label>
                      <input type="text" value={vcardPhone} onChange={(e) => setVcardPhone(e.target.value)} className="w-full p-3 border border-border-theme rounded-lg bg-div-secondary outline-none" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">邮箱</label>
                      <input type="email" value={vcardEmail} onChange={(e) => setVcardEmail(e.target.value)} className="w-full p-3 border border-border-theme rounded-lg bg-div-secondary outline-none" />
                   </div>
                   {contentError && (
                      <p className="text-sm text-red-500">{contentError}</p>
                   )}
                   <p className="text-xs text-text-secondary">
                     当前内容长度: {content.length} 字符 / 最大 {MAX_LENGTHS[activeTab] || 1000} 字符
                   </p>
                </div>
              )}
           </div>

           {/* Customization */}
           <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme p-6">
              <h3 className="font-bold text-text-theme mb-4 flex items-center gap-2">
                 <Settings size={18} />
                 样式设置
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">前景色</label>
                    <div className="flex gap-2">
                       <input 
                         type="color" 
                         value={fgColor}
                         onChange={(e) => setFgColor(e.target.value)}
                         className="h-10 w-14 p-1 rounded border border-border-theme cursor-pointer"
                       />
                       <input 
                         type="text" 
                         value={fgColor}
                         onChange={(e) => setFgColor(e.target.value)}
                         className="flex-1 p-2 border border-border-theme rounded-lg bg-div-secondary uppercase font-mono"
                       />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">背景色</label>
                    <div className="flex gap-2">
                       <input 
                         type="color" 
                         value={bgColor}
                         onChange={(e) => setBgColor(e.target.value)}
                         className="h-10 w-14 p-1 rounded border border-border-theme cursor-pointer"
                       />
                       <input 
                         type="text" 
                         value={bgColor}
                         onChange={(e) => setBgColor(e.target.value)}
                         className="flex-1 p-2 border border-border-theme rounded-lg bg-div-secondary uppercase font-mono"
                       />
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Logo 图片</label>
                    <div className="flex gap-2 items-center">
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="px-4 py-2 bg-div-secondary hover:bg-div-hover dark:hover:bg-div-hover rounded-lg text-sm flex items-center gap-2"
                       >
                          <ImageIcon size={16} />
                          上传
                       </button>
                       <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleLogoUpload} 
                          accept="image/*" 
                          className="hidden" 
                       />
                       {logoUrl && (
                          <div className="relative">
                             <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover border border-border-theme" />
                             <button 
                               onClick={() => { setLogoUrl(''); setIncludeLogo(false); }}
                               className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                             >
                                <X size={10} />
                             </button>
                          </div>
                       )}
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">纠错等级 (Error Level)</label>
                    <select 
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full p-2 border border-border-theme rounded-lg bg-div-secondary outline-none"
                    >
                       <option value="L">低 (L) - 7%</option>
                       <option value="M">中 (M) - 15%</option>
                       <option value="Q">四分之一 (Q) - 25%</option>
                       <option value="H">高 (H) - 30%</option>
                    </select>
                 </div>
              </div>
           </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-5">
           <div className="sticky top-6">
              <div className="bg-div-theme rounded-2xl shadow-lg border border-border-theme p-8 flex flex-col items-center">
                 <h2 className="text-xl font-bold text-text-theme mb-6">二维码预览</h2>
                 
                 <div 
                   ref={qrRef}
                   className="p-4 bg-div-secondary rounded-xl shadow-sm border border-border-theme mb-8 cursor-pointer"
                   onClick={() => setShowModal(true)}
                 >
                    {isContentValid && (
                      <QRCodeCanvas
                         value={content}
                         size={size}
                         bgColor={bgColor}
                         fgColor={fgColor}
                         level={level}
                         includeMargin={true}
                         imageSettings={includeLogo && logoUrl ? {
                            src: logoUrl,
                            x: undefined,
                            y: undefined,
                            height: logoSize,
                            width: logoSize,
                            excavate: true,
                         } : undefined}
                      />
                    )}
                    {!isContentValid && (
                      <div className="w-64 h-64 flex items-center justify-center border-2 border-dashed border-gray-400 rounded-lg">
                        <p className="text-text-secondary text-sm text-center">
                          内容过长，无法生成二维码
                        </p>
                      </div>
                    )}
                 </div>

                 <button 
                   onClick={() => handleDownload('png')}
                   className="w-full py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-hover flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all active:scale-[0.98]"
                 >
                    <Download size={20} />
                    下载 PNG 图片
                 </button>
              </div>
           </div>
        </div>
        
        {/* Modal */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <div 
              className="bg-div-theme rounded-2xl shadow-2xl border border-border-theme p-8 max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text-theme">二维码预览</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-div-secondary rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex flex-col items-center">
                <div 
                  ref={modalQrRef}
                  className="p-4 bg-div-secondary rounded-xl shadow-sm border border-border-theme mb-6 overflow-auto max-w-full"
                  onWheel={handleWheel}
                >
                  {isContentValid && (
                    <QRCodeCanvas
                       value={content}
                       size={modalSize}
                       bgColor={bgColor}
                       fgColor={fgColor}
                       level={level}
                       includeMargin={true}
                       imageSettings={includeLogo && logoUrl ? {
                          src: logoUrl,
                          x: undefined,
                          y: undefined,
                          height: logoSize,
                          width: logoSize,
                          excavate: true,
                       } : undefined}
                    />
                  )}
                  {!isContentValid && (
                    <div className="w-64 h-64 flex items-center justify-center border-2 border-dashed border-gray-400 rounded-lg">
                      <p className="text-text-secondary text-sm text-center">
                        内容过长，无法生成二维码
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="w-full max-w-md space-y-4">
                  <div>
                     <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-secondary">尺寸</span>
                        <span className="text-text-theme font-mono">{modalSize}px</span>
                     </div>
                     <input 
                       type="range" 
                       min="128" 
                       max="1024" 
                       step="32" 
                       value={modalSize} 
                       onChange={(e) => setModalSize(parseInt(e.target.value))}
                       className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                       style={{
                         accentColor: '#6b7280',
                         background: '#e5e7eb',
                         height: '8px',
                         borderRadius: '4px'
                       }}
                     />
                  </div>
                  
                  <p className="text-sm text-text-secondary text-center">提示：可以使用鼠标滚轮调整二维码大小</p>
                  
                  <button 
                    onClick={() => handleDownload('png', true)}
                    className="w-full py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-hover flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all active:scale-[0.98]"
                  >
                     <Download size={20} />
                     下载 PNG 图片
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple X icon component since I didn't import it
const X = ({ size = 24, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export default QRCodeGenerator;