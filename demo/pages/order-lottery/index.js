const remote = require('../../utils/remote');
const track = [0, 1, 2, 5, 8, 7, 6, 3];

Page(remote.page({
  data: {
    connected: false, loading: true, busy: false, rules: null, lotteryState: null,
    description: '', imageReady: false, proofs: [], draws: [], drawResult: null,
    board: [], boardIndex: 0, boardCount: 1, activeSlot: -1
  },
  onShow() {
    this.loadRemote();
  },
  async loadRemote() {
    try {
      await remote.refresh();
      const { rules, customer } = remote.get();
      this.prizes = rules.lottery.prizes;
      this.setData({
        rules, connected: true, loading: false, draws: customer.draws,
        proofs: customer.proofs.map(proof => ({
          ...proof, label: { pending: '审核中', approved: '已通过', rejected: '未通过' }[proof.status]
        }))
      });
      this.showBoard(Math.min(this.data.boardIndex, this.boardCount() - 1));
      this.loadLotteryState();
    } catch (error) {
      this.setData({ connected: false, loading: false, error: error.message });
    }
  },
  boardCount() {
    return Math.max(1, Math.ceil(this.prizes.length / track.length));
  },
  showBoard(boardIndex) {
    const board = Array.from({ length: 9 }, (_, slot) => ({ slot, name: '—' }));
    this.prizes.slice(boardIndex * track.length, (boardIndex + 1) * track.length)
      .forEach((prize, index) => { board[track[index]].name = prize.name; });
    this.setData({ board, boardIndex, boardCount: this.boardCount() });
  },
  changeBoard(event) {
    this.setData({ activeSlot: -1 });
    this.showBoard(this.data.boardIndex + Number(event.currentTarget.dataset.step));
  },
  retry() {
    this.loadRemote();
  },
  loadLotteryState() {
    remote.request('customer/lottery/state')
      .then(lotteryState => this.setData({ lotteryState }))
      .catch(() => this.setData({ lotteryState: null }));
  },
  async draw() {
    const { busy, lotteryState } = this.data;
    if (busy || !lotteryState?.active || lotteryState.remaining === 0) return;
    const proof = this.data.proofs.find(item => item.status === 'approved');
    this.setData({ busy: true, drawResult: null, activeSlot: -1 });
    try {
      const result = await remote.request('customer/lottery/draw', 'POST', { proofId: proof?.id || null });
      if (this.unloaded) return;
      const prizeIndex = this.prizes.findIndex(prize => prize.id === result.prizeId);
      if (prizeIndex < 0) {
        this.finishDraw(result);
        return;
      }
      this.showBoard(Math.floor(prizeIndex / track.length));
      const stop = track.length * 2 + prizeIndex % track.length;
      let step = 0;
      const advance = () => {
        this.setData({ activeSlot: track[step % track.length] });
        if (step === stop) {
          this.finishDraw(result);
          return;
        }
        step += 1;
        this.drawTimer = setTimeout(advance, 55 + Math.max(0, step - stop + 5) * 35);
      };
      advance();
    } catch (error) {
      this.setData({ busy: false });
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },
  finishDraw(result) {
    this.setData({ drawResult: result, busy: false, lotteryState: null });
    this.loadRemote();
  },
  onUnload() {
    this.unloaded = true;
    clearTimeout(this.drawTimer);
  },
  describe(e){this.setData({description:e.detail.value});},chooseImage(){wx.chooseMedia({count:1,mediaType:['image'],sourceType:['album'],success:r=>{const file=r.tempFiles[0];if(file.size>3000000){wx.showToast({title:'请选择小于3MB的图片',icon:'none'});return;}wx.getFileSystemManager().readFile({filePath:file.tempFilePath,encoding:'base64',success:r=>{this.proofBase64=r.data;this.setData({imageReady:true});},fail:()=>wx.showToast({title:'图片读取失败',icon:'none'})});}});},submitProof(){if(this.data.busy)return;if(!this.proofBase64||!this.data.description.trim()){wx.showToast({title:'请填写说明并上传订单截图',icon:'none'});return;}this.setData({busy:true});remote.request('customer/uploads','POST',{base64:this.proofBase64}).then(r=>remote.request('customer/proofs','POST',{imageId:r.imageId,description:this.data.description})).then(()=>{this.proofBase64='';this.setData({description:'',imageReady:false});wx.showToast({title:'已提交，等待审核',icon:'none'});this.loadRemote();}).catch(e=>wx.showToast({title:e.message,icon:'none'})).finally(()=>this.setData({busy:false}));},
}));
