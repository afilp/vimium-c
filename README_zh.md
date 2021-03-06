<span style="color: #2f508e;">Vim</span>ium <span style="color: #a55e18;">C</span>
![Icon](icons/icon32.png) - 全键盘操作浏览器
============================================

[![MIT 许可协议](https://img.shields.io/badge/许可协议-MIT-blue.svg)](LICENSE.txt)
[![版本：1.81.5](https://img.shields.io/badge/版本-1.81.5-orange.svg
  )](https://github.com/gdh1995/vimium-c/releases)
**在 [Chrome 网上应用店](
  https://chrome.google.com/webstore/detail/vimium-c-all-by-keyboard/hfjbmagddngcpeloejdejnfgbamkjaeg
  ) /
[Firefox 附加组件](
  https://addons.mozilla.org/zh-CN/firefox/addon/vimium-c/
  ) /
[MS Edge 插件商店](
  https://microsoftedge.microsoft.com/addons/detail/aibcglbfblnogfjhbcmmpobjhnomhcdo
  ) 中查看**

Vimium C 是一款开源、免费的键盘增强类浏览器扩展，支持为多种多样的命令任意设置快捷键。
只要有一个键盘，您就能自由点击网页中的链接和按钮、选择和复制文字和网址，也能轻松操作浏览器标签页，
还能在一个便捷的搜索框中随意搜索历史记录、收藏夹或打开的标签等等。

本项目主要由 [gdh1995](https://github.com/gdh1995) 开发并维护，并且以 [MIT 许可协议](LICENSE.txt) 开源。

本项目地址是 https://github.com/gdh1995/vimium-c
。本项目的前身是[<span style="color: #2f508e;">Vim</span>ium](https://github.com/philc/vimium)。

[Here's its description in English](README.md)（点击查看英文介绍）。

# 主要功能

## 多种多样的命令

它支持很多网页上的常用操作：
* 按 F 自动发现并标出可点击的链接和按钮，输入一个定位标记上的文字就能点击它
* 按 字母O 可以显示一个方便美观的搜索框，在里边可以随意检索历史记录和收藏夹，还能自定义搜索引擎来快速打开搜索页面、
查找已打开的标签页、实时计算数学表达式等等。甚至可以按 Shift+Enter（上档键+回车）来删除选中的历史记录。
* 按 J/K/H/L 来像 VIM 里移动光标一样滚动屏幕内容
* 按 “/” 显示页内查找浮层，输入“\r”可以做正则查找，“\w”会执行整词匹配，还有\R、\W、\i和\I等多种用法
* 按 V 进入自由选择模式后，能像 VIM 一样用 J/K/H/L等快捷键 修改文字的选择范围
* 按 “？”显示帮助对话框，快速查看所有设置过的快捷键

当需要操作浏览器标签页时，它可以：
* 按 Shift+J、Shift+K、“g0” 或 “g$” 来切换到左侧、右侧、最左或最右的标签页
* 按 “^”（Shift+6）切换到最近访问的上一个标签页
* 按 X 关闭当前网页，然后按 Shift+X 可以恢复它。关闭网页时默认会保留一个窗口来避免浏览器退出
* 按 “M+字母” 创建标记，在别的网页就可以按 “`+字母” 切换到（或者打开）这个标记的网页
* 按 R 刷新网页，Shift+W 移动网页到下一个窗口，“yt” 复制标签页

以上所有快捷键都可以解绑或重新绑定其它命令，也可以添加新的快捷键。
绑定快捷键到新的命令后，还可以做到切换网页静音、丢弃其它网页、切换网站的图片/JS功能权限、在无痕模式中重新打开等等。

## 快捷键高级用法

大部分命令都支持按下数字前缀来设置数量。比如 “5” 后跟 “Shift+X” 可以恢复 5 个最近关闭的标签页，
而依次按下 “-15X” 则会关闭当前和左侧的共 15 个标签页。
很多命令都支持通过参数来改变具体的操作细节，可以在自定义快捷键指定参数。

如果需要在某些网页上禁用特定的快捷键，可以在扩展选项页面里制定相关规则。
筛选网址时可使用正则表达式，指定的快捷键列表支持“只禁用列表内”和“列表外全禁用”两种模式。

普通快捷键是通过JavaScript脚本程序识别的，存在被其它模块拦截的可能性。
如果需要让快捷键绝对生效，Vimium C 提供了 8 个全局快捷键，可以自由绑定到任意所需命令上。
但需要注意不支持按网址规则禁用全局快捷键。

Vimium C 还提供了一个用于浏览器地址栏的搜索引擎 “v”，在地址栏输入 “v+空格”即可进入搜索模式。
此模式类似于按 字母O 显示的搜索框，会自动检索历史记录和收藏夹，也能指定搜索引擎拼接想要的网址。
输入 “:t” + 空格 后还能查找已打开的标签页。

## 中文处理的优化

* 支持识别网址中 GBK 编码的汉字（比如百度贴吧网址的贴吧名）进而在搜索框中搜索，可以自定义要识别的编码
* 在自由选择模式中，使用 w、e、b 等处理词语的快捷键时，会在中文词语的开始/结束位置处停顿
* 浏览器语言设置为中文时，默认设置“百度搜索”为默认搜索引擎
* “上一页”和“下一页”功能默认会识别中文里常用于翻页按钮的词语

## 安全与隐私

Vimium C 具有完善的安全机制：
* 处理网页内容时，及时清理使用痕迹，执行命令期间的文字输入、操作结果等等都会被丢弃
* 上述搜索框支持设置屏蔽词来隐藏部分搜索结果（主动搜索了某屏蔽词时则不隐藏）
* 当它收到来自其它扩展程序的消息时，会按照一份用户指定的受信任扩展标识符的列表来审核消息来源
* 可以关闭“借助浏览器账号同步扩展设置”的功能，且此同步功能不会同步页内查找历史等信息

# 捐赠 / Donate

<a name="donate"></a>
Vimium C 是一款开源的浏览器扩展程序，任何人都可以安装使用它而无需支付任何费用。
如果您确实想要资助它的开发者（[gdh1995](https://gdh1995.cn/)），
可以通过[支付宝](https://www.alipay.com/)或 [PayPal](https://www.paypal.com/)
无偿赠与他一小笔钱。谢谢您的支持！

Vimium C is an open-source browser extension, and everyone can install and use it free of charge.
If you indeed want to give its author ([gdh1995](https://gdh1995.cn/)) financial support,
you may donate any small amount of money to him through [PayPal](https://www.paypal.com/)
  or [Alipay](https://intl.alipay.com/). Thanks a lot!

支付宝（Alipay）：<br/>
![gdh1995 的支付宝二维码](https://gdh1995.cn/alipay-recv-money.png)

PayPal: https://www.paypal.me/gdh1995 (accout: gdh1995@qq.com)

# 关于适用区域的声明

[Vimium C](https://chrome.google.com/webstore/detail/vimium-c-all-by-keyboard/hfjbmagddngcpeloejdejnfgbamkjaeg)
和 [gdh1995](https://github.com/gdh1995) 发布的其他扩展，在被发布到“Chrome 网上应用店”和“微软 Edge
浏览器插件商店”等商店上时，均已向*所有地区*的所有人公开。
但这个行为只是为了让这些插件更容易使用，**并不代表或者暗示**作者 gdh1995 “同意或者不反对”“台湾”一词可以同“中国”并列。
虽然并列显示这一现状的确**不正确地出现**在了这些商店的页面中（2019年11月16日确认）。

根据[《中华人民共和国宪法》](http://www.npc.gov.cn/npc/c505/201803/e87e5cd7c1ce46ef866f4ec8e2d709ea.shtml
    )和国际共识，*台湾是中华人民共和国的**神圣领土（不可分割的）一部分***。

# 更多

https://github.com/gdh1995/vimium-c 公开了项目源码、版本更新历史、操作手册（Wiki）等。
如果遇到任何使用上的问题或者有新的功能意见和建议，都可以去仓库的“issues”页面上提出。
