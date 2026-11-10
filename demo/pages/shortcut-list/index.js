const remote=require('../../utils/remote');Page(remote.page({data:{shortcuts:[]},onShow(){this.setData({shortcuts:remote.get()?.rules?.homeShortcuts?.items||[]});}}));
