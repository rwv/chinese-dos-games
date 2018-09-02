{-----------------------------------------------------------------------}
{VESABOX						GL:01/05/90	}
{-----------------------------------------------------------------------}
{Program for viewing current screen characteristics in a VESA kind of	}
{manner.								}
{-----------------------------------------------------------------------}
{The following program is written to loosely conform to the VESA 	}
{Super VGA BIOS Extension document VS891001.  The program is intended	}
{as a demonstration and is not intended to be an example of a 		}
{high-performance implementations of the VESA standard.			}
{If you find any omissions or errors, please report them to me on the 	}
{Everex Systems BBS at (415) 683-2984.					}
{						Gary Lorensen		}
{						Everex Systems, Inc.	}
{						48571 Milmont Dr. B3	}
{						Fremont, CA   94538	}
{-----------------------------------------------------------------------}

uses
    dos;

{-----------------------------------------------------------------------}

const
  ULCorner = #218;  {Line drawing characters}
  URCorner = #191;
  LLCorner = #192;
  LRCorner = #217;
  VertBar  = #179;
  HorzBar  = #196;

  rSequAddr = $3C4;

{-----------------------------------------------------------------------}

type
    s80 = string[80];
    s8  = string[8];

    CharString = array [$00..$03] of char;

    ModeListType = array [$00..$00] of word;

    PageFuncPtrType = pointer;

    VgaInfoBlockType = record
        VESASignature	: CharString;
	VESAVersion     : word;
	OEMStringPtr	: ^CharString;
	Capabilities	: array [$00..$03] of byte;
	VideoModePtr    : ^ModeListType;
	reserved	: array [$00..$ED] of byte;	{Pad to 256}
    end;

    ModeInfoBlockType = record
	 				{mandatory information}
	ModeAttributes	: word;
	WinAAttributes	: byte;
	WinBAttributes	: byte;
	WinGranularity	: word;
	WinSize		: word;
	WinASegment	: word;
	WinBSegment	: word;
	WinFuncPtr	: PageFuncPtrType;
	BytesPerScanLine : word;

					{optional information}
	XResolution	: word;
	YResolution	: word;
	XCharSize	: byte;
	YCharSize	: byte;
	NumberOfPlanes	: byte;
	BitsPerPixel	: byte;
	NumberOfBanks	: byte;
	MemoryModel	: byte;
	BankSize	: byte;
	reserved	: array [$00..$E2] of byte;	{Pad to 256}
    end;

    ScrCharType = record
        ch   : char;
	attr : byte;
    end;

    ScrTextPtrType = ^ScrTextType;
    ScrTextType = array [$0000..$0000] of ScrCharType;
    ScrGrfxPtrType = ^ScrGrfxType;
    ScrGrfxType = array [$0000..$0000] of byte;

{-----------------------------------------------------------------------}
{-----------------------------------------------------------------------}

var
    reg : Registers;
    VesaVgaInfo : VgaInfoBlockType;
    VesaModeInfo : ModeInfoBlockType;
    i : word;
    VesaMode    : word;
    error : boolean;
    textscr : ScrTextPtrType;
    grfxscr : ScrGrfxPtrType;
    pixofs  : longint;
    pixbank : byte;
    prevbank : byte;
    x,y     : word;

{-----------------------------------------------------------------------}
{-----------------------------------------------------------------------}

function decval(ch : char) : byte;

begin
    decval := 0;
    if ((ch>='0') and (ch<='9')) then
        decval := ord(ch)-ord('0');
    if ((ch>='A') and (ch<='F')) then
        decval := ord(ch)-ord('A')+$0A;
    if ((ch>='a') and (ch<='f')) then
        decval := ord(ch)-ord('a')+$0A;
end;

function hex2dec(s : s80) : word;

var
    i     : byte;
    tmp   : word;
    place : word;
    error : boolean;

begin
    i := ord(s[0]);
    error := false;
    place := 1;
    tmp := 0;
    while (i>0) and not(error) do begin
        error := not(((s[i]>='0')and(s[i]<='9')) 
	    or ((s[i]>='a')and(s[i]<='f'))
	    or ((s[i]>='A')and(s[i]<='F')));
        tmp := tmp+place*decval(s[i]);
	i:=i-1;
	place := place*$10;
    end;
    if (error) then
        hex2dec := $FFFF
    else
        hex2dec := tmp;
end;

{-----------------------------------------------------------------------}

function hexval(x : byte) : char;

begin
    hexval := '0';
    if ((x>=0) and (x<=9)) then
        hexval := chr(x+ord('0'));
    if ((x>=10) and (x<=15)) then
        hexval := chr(x-10+ord('A'));
end;

function dec2hex(x : word) : s8;

var
    tmp   : s8;
    place : word;

begin
{    tmp   := '0';}
    tmp := ' ';
    if (x>=$100) then
        place := $1000
    else
        place := $10;

    repeat
        tmp := tmp+hexval(x div place);
	x := x mod place;
	place := place div $10;
    until (place=$0000);

    dec2hex := tmp+'h';
end;


function hex(x : word) : s8;

var
    tmp   : s8;
    place : word;

begin
    tmp := '0';
    if (x>=$100) then
        place := $1000
    else
        place := $10;

    repeat
        tmp := tmp+hexval(x div place);
	x := x mod place;
	place := place div $10;
    until (place=$0000);

    hex := tmp+'h';
end;

function addrhex(x : word) : s8;

var
    tmp   : s8;
    place : word;

begin
    tmp := '';
    place := $1000;

    repeat
        tmp := tmp+hexval(x div place);
	x := x mod place;
	place := place div $10;
    until (place=$0000);

    addrhex := tmp;
end;

{-----------------------------------------------------------------------}

procedure SetVesaBank(win  : byte;
                      bank : byte);

var
    reg : Registers;

begin
    reg.AX := $4F05;
    reg.BH := $00;
    reg.BL := win;
    reg.DX := bank;
    intr($10,reg);
end;

{-----------------------------------------------------------------------}

procedure GetVesaBank(win  : byte;
                      var bank : byte);

var
    reg : Registers;

begin
    reg.AX := $4F05;
    reg.BH := $01;
    reg.BL := win;
    intr($10,reg);
    bank := reg.DX;
end;

{-----------------------------------------------------------------------}
{-----------------------------------------------------------------------}

begin
    error := false;

    writeln('VESA BIOS Extensions BOX program');
    writeln('1990 Everex Systems, Inc.');

    reg.AX := $4F00;
    reg.ES := Seg(VesaVgaInfo);
    reg.DI := Ofs(VesaVgaInfo);
    intr($10,reg);

    if (reg.AL<>$4F) then begin
        writeln('ERROR: VESA Function 00h: Return Super VGA Information not supported.');
	error := true;
    end;

    if (reg.AH<>$00) then begin
        writeln('ERROR: VESA Function 00h: Return Super VGA Information failed.');
	error := true;
    end;

    if not(error) then begin

        reg.AX := $4F03;
	intr($10,reg);

	if (reg.al<>$4F) then
	    error := true;

        if (reg.AH<>$00) then
	    error := true;

	if not(error) then begin
	    VesaMode := reg.BX;

	    reg.AX := $4F01;
	    reg.CX := VesaMode;
	    reg.ES := Seg(VesaModeInfo);
	    reg.DI := Ofs(VesaModeInfo);
            intr($10,reg);

            if (reg.AL<>$4F) then
	        error := true;

	    if (reg.AH<>$00) then
	        error := true

	    else if ((error) or ((VesaModeInfo.ModeAttributes and $02)=$00)) then
	        error := true

	    else begin
	        write(VesaModeInfo.XResolution:4,'x',VesaModeInfo.YResolution:3);
	        if ((VesaModeInfo.ModeAttributes and $10)=$10) then
	            write('x',VesaModeInfo.NumberOfPlanes:1)
	        else
	            write('  ');
	        write(' ',VesaModeInfo.BitsPerPixel:1,'bpp');
	        write(' ',VesaModeInfo.XCharSize:2,'x',VesaModeInfo.YCharSize:2);
	        write(' ');

	        if ((VesaModeInfo.ModeAttributes and $08)=$08) then
	            write('Color ')
	        else
	            write('Mono  ');

	        if (VesaModeInfo.BankSize>0) then 
	            write(' ',VesaModeInfo.BankSize:2,'Kx',VesaModeInfo.NumberOfBanks:1);

	        if ((VesaModeInfo.WinAAttributes and $01)=$01) then begin
	            write('A:',addrhex(VesaModeInfo.WinASegment),' ');
		    if ((VesaModeInfo.WinAAttributes and $02)=$02) then
		        write('R')
		    else 
		        write(' ');
		    if ((VesaModeInfo.WinAAttributes and $04)=$04) then
		        write('W')
		    else 
		        write(' ');
	        end else
	            write('         ');

	        if ((VesaModeInfo.WinBAttributes and $01)=$01) then begin
	            write('B:',addrhex(VesaModeInfo.WinBSegment),' ');
		    if ((VesaModeInfo.WinBAttributes and $02)=$02) then
		        write('R')
		    else 
		        write(' ');
		    if ((VesaModeInfo.WinBAttributes and $04)=$04) then
		        write('W')
		    else 
		        write(' ');
	        end else
	            write('         ');

	        case (VesaModeInfo.MemoryModel) of
	            $00 : write('Text');
	            $01 : write('CGA Grfx');
	            $02 : write('HGC Grfx');
	            $03 : write('16 Grfx');
	            $04 : write('Packed Pixel Grfx');
	            $05 : write('Sequ 256 Grfx');
	            $06,$07,$08,$09,$0A,$0B,$0C,$0D,$0E,$0F
		        : write('reserved for VESA');
	        else
		    write('OEM memory model');
	        end;
	        writeln;

	        write('            ');
	        if ((VesaModeInfo.ModeAttributes and $01)=$01) then
	            write('Present.      ')
	        else
	            write('Not present.  ');

	        if ((VesaModeInfo.ModeAttributes and $04)=$04) then
	            write('BIOS')
	        else
	            write('    ');

	        write('  ',VesaModeInfo.BytesPerScanLine:3,' raster.  ');

	        write('Win: ');
	        write(VesaModeInfo.WinSize:2,'Kx');
	        write(VesaModeInfo.WinSize:2,'K  ');
	        write('WinFunc: ',addrhex(Seg(VesaModeInfo.WinFuncPtr^)));
	        write(':',addrhex(Ofs(VesaModeInfo.WinFuncPtr^)));

	        writeln;

		with VesaModeInfo do begin

	            case (MemoryModel) of
	                $00 : begin
		            textscr := Ptr(WinASegment,$0000);
			    textscr^[0].ch := ULCorner;
			    textscr^[BytesPerScanLine div 2*(YResolution-1)].ch 
			        := LLCorner;
			    for i := 1 to XResolution-2 do begin
			        textscr^[i].ch := HorzBar;
			        textscr^[BytesPerScanLine div 2*(YResolution-1)+i].ch 
			            := HorzBar;
			    end;
			    textscr^[XResolution-1].ch := URCorner;
			    textscr^[BytesPerScanLine div 2*(YResolution-1)+XResolution-1].ch 
			        := LRCorner;
			    for i := 1 to YResolution-2 do begin
			        textscr^[BytesPerScanLine div 2*i].ch 
			            := VertBar;
			        textscr^[BytesPerScanLine div 2*i+XResolution-1].ch 
			            := VertBar;
			    end;
		        end;
	                $01 : write('CGA Grfx');
	                $02 : write('HGC Grfx');
	                $03 : begin

			    Port[rSequAddr  ] := $02;
			    Port[rSequAddr+1] := $07;

		            grfxscr := Ptr(WinASegment,$0000);

			    GetVesaBank(0,prevbank);

			    SetVesaBank(0,0);
			    for x := 0 to BytesPerScanLine-1 do
			        grfxscr^[x] := grfxscr^[x] or $FF;

			    x := 0;
			    y := YResolution-1;
			    pixofs  := longint(y)*BytesPerScanLine + x;
			    pixbank := pixofs div (longint(WinGranularity)*1024);
			    pixofs  := pixofs mod (longint(WinGranularity)*1024);

			    SetVesaBank(0,pixbank);
			    if ((longint(WinSize)*1024-pixofs)>BytesPerScanLine) then begin
			        for x := 0 to BytesPerScanLine-1 do
			            grfxscr^[pixofs+x] := grfxscr^[pixofs+x] or $FF;
			    end else begin
			        for x := 0 to (longint(WinSize)*1024-pixofs)-1 do
			            grfxscr^[pixofs+x] := grfxscr^[pixofs+x] or $FF;
			        SetVesaBank(0,pixbank+1);
				pixofs := 0;
			        for x := 0 to BytesPerScanLine-x-1 do
			            grfxscr^[pixofs+x] := grfxscr^[pixofs+x] or $FF;
			    end;

			    x := 0;
			    y := 0;
			    pixofs  := longint(y)*BytesPerScanLine + x;
			    pixbank := pixofs div (longint(WinGranularity)*1024);
			    pixofs  := pixofs mod (longint(WinGranularity)*1024);

			    SetVesaBank(0,pixbank);
			    repeat
			        grfxscr^[pixofs] := grfxscr^[pixofs] or $80;
				pixofs := pixofs + BytesPerScanLine;
				if (pixofs>longint(WinSize)*1024) then begin
				    pixofs := pixofs mod (longint(WinSize)*1024);
				    pixbank := pixbank+1;
			            SetVesaBank(0,pixbank);
				end;
				y := y+1;
			    until (y=YResolution-1);

			    x := BytesPerScanLine-1;
			    y := 0;
			    pixofs  := longint(y)*BytesPerScanLine + x;
			    pixbank := pixofs div (longint(WinGranularity)*1024);
			    pixofs  := pixofs mod (longint(WinGranularity)*1024);

			    SetVesaBank(0,pixbank);
			    repeat
			        grfxscr^[pixofs] := grfxscr^[pixofs] or $01;
				pixofs := pixofs + BytesPerScanLine;
				if (pixofs>longint(WinSize)*1024) then begin
				    pixofs := pixofs mod (longint(WinSize)*1024);
				    pixbank := pixbank+1;
			            SetVesaBank(0,pixbank);
				end;
				y := y+1;
			    until (y=YResolution);

			    Port[rSequAddr  ] := $02;
			    Port[rSequAddr+1] := $0F;

			    SetVesaBank(0,prevbank);
		        end;
	                $04 : if (BitsPerPixel=8) then begin
		            grfxscr := Ptr(WinASegment,$0000);

			    GetVesaBank(0,prevbank);

			    SetVesaBank(0,0);
			    for x := 0 to BytesPerScanLine-1 do
			        grfxscr^[x] := $07;

			    x := 0;
			    y := YResolution-1;
			    pixofs  := longint(y)*BytesPerScanLine + x;
			    pixbank := pixofs div (longint(WinGranularity)*1024);
			    pixofs  := pixofs mod (longint(WinGranularity)*1024);

			    SetVesaBank(0,pixbank);
			    if ((longint(WinSize)*1024-pixofs)>BytesPerScanLine) then begin
			        for x := 0 to BytesPerScanLine-1 do
			            grfxscr^[pixofs+x] := $07;
			    end else begin
			        for x := 0 to (longint(WinSize)*1024-pixofs)-1 do
			            grfxscr^[pixofs+x] := $07;
			        SetVesaBank(0,pixbank+1);
				pixofs := 0;
			        for x := 0 to BytesPerScanLine-x-1 do
			            grfxscr^[pixofs+x] := $07;
			    end;

			    x := 0;
			    y := 0;
			    pixofs  := longint(y)*BytesPerScanLine + x;
			    pixbank := pixofs div (longint(WinGranularity)*1024);
			    pixofs  := pixofs mod (longint(WinGranularity)*1024);

			    SetVesaBank(0,pixbank);
			    repeat
			        grfxscr^[pixofs] := $07;
				pixofs := pixofs + BytesPerScanLine;
				if (pixofs>longint(WinSize)*1024) then begin
				    pixofs := pixofs mod (longint(WinSize)*1024);
				    pixbank := pixbank+1;
			            SetVesaBank(0,pixbank);
				end;
				y := y+1;
			    until (y=YResolution);

			    x := XResolution-1;
			    y := 0;
			    pixofs  := longint(y)*BytesPerScanLine + x;
			    pixbank := pixofs div (longint(WinGranularity)*1024);
			    pixofs  := pixofs mod (longint(WinGranularity)*1024);

			    SetVesaBank(0,pixbank);
			    repeat
			        grfxscr^[pixofs] := $07;
				pixofs := pixofs + BytesPerScanLine;
				if (pixofs>longint(WinSize)*1024) then begin
				    pixofs := pixofs mod (longint(WinSize)*1024);
				    pixbank := pixbank+1;
			            SetVesaBank(0,pixbank);
				end;
				y := y+1;
			    until (y=YResolution);

			    SetVesaBank(0,prevbank);
		        end;
	                $05 : write('Sequ 256 Grfx');
	                $06,$07,$08,$09,$0A,$0B,$0C,$0D,$0E,$0F
		            : write('reserved for VESA');
	            else
		        write('OEM memory model');
	            end;

		end;

	    end;    
        end;

    end;

end.

{-----------------------------------------------------------------------}
{-----------------------------------------------------------------------}


