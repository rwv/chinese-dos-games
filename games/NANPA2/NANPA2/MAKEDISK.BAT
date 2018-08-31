@echo off
if "%1" == "" goto usage
if "%1" == "ibm5" goto mess
if "%1" == "IBM5" goto mess
if "%1" == "pc6" goto mess
if "%1" == "PC6" goto mess
if "%1" == "ms6" goto mess
if "%1" == "MS6" goto mess
goto usage
:mess
echo 注意！！
echo ・このバッチファイルは空きメインメモリーをできるだけ作った状態の立ち上げ
echo 　用のディスクを作成するための物です。
echo ・このバッチファイルによって作られる“CONFIG.SYS”と“AUTOEXEC.BAT”はあ
echo 　くまでも通常のデスクトップ及びタワー型パソコン用のサンプルですので、一
echo 　部のノートパソコン（ＦＤＤをＰＣＭＣＩＡカードで接続するタイプの物）等
echo 　では動作させることができなかったり、また省電力用のドライバも組み込みま
echo 　せんので、省電力機能が働かなかったりします。
echo 　その場合は、それぞれのドライバをこのバッチファイルによってフロッピーに
echo 　作成される“CONFIG.SYS”及び“AUTOEXEC.BAT”に追加するようにして下さい。
echo 　ただし、追加されるドライバによってメモリーが不足する可能性がありますので
echo 　極力ＵＭＢを使う等、メモリーを空けて下さい（ＵＭＢの使用法等はＤＯＳ付属
echo 　のマニュアルを参照して下さい）
echo ・あらかじめフォーマットされたフロッピーを１枚用意して下さい。
echo 　フォーマットのしかたは、
echo 　FORMAT A:[Enter]
echo 　です。
echo 　このバッチファイルはハードディスクをＣドライブ、フロッピードライブを
echo 　Ａドライブとして動作いたしますので、違う環境の場合はバッチファイルの中
echo 　のドライブの指定のところを書き換えてから実行して下さい。
echo ・途中でやめたい場合は［Ｃｔｒｌ］＋［Ｃ］を押してバッチファイルの実行を
echo 　止めて下さい。
echo フォーマットされたフロッピーをＡドライブに挿入して準備ができたら何かキー
echo を押して下さい。
pause > nul
sys c:\ a:
if "%1" == "ibm5" goto ibm5
if "%1" == "IBM5" goto ibm5
if "%1" == "pc6" goto pc6
if "%1" == "PC6" goto pc6
rem ms6
copy config.ms6 a:config.sys /v /y > nul
copy autoexec.ms6 a:autoexec.bat /v /y > nul
goto mess1
:ibm5
copy config.pc5 a:config.sys /v > nul
copy autoexec.pc5 a:autoexec.bat /v > nul
copy c:\$jpnhn16.fnt a: /v > nul
copy c:\$jpnhn19.fnt a: /v > nul
copy c:\$jpnzn16.fnt a: /v > nul
goto mess1
:pc6
copy config.pc6 a:config.sys /v /y > nul
copy autoexec.pc6 a:autoexec.bat /v /y > nul
:mess1
echo 立ち上げディスクの作成は終了しました。
echo ゲームをするときは立ち上げディスクを挿入してＤＯＳを立ち上げて下さい。
echo 今までの環境に戻す時には立ち上げディスクを抜いてＤＯＳを立ち上げて下さい。
goto end
:usage
echo 使用法：MAKEDISK IBM5[Enter] ... IBM DOS version J5.0/V 用
echo 　　　　MAKEDISK PC6[Enter]  ...  PC DOS version J6.x/V 用
echo 　　　　MAKEDISK MS6[Enter]  ...  MS DOS version J6.2/V 用
echo 　　　　注意：あらかじめフォーマットされたフロッピーを１枚用意して下さい。
echo 　　　　　　　フォーマットのしかたは、
echo 　　　　　　　FORMAT A:[Enter]
echo 　　　　　　　です（フロッピーがＡドライブの場合）
:end
