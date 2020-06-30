import request from '../../api/request'

const state = {
  // TaskList
  taskList: [],
  taskListTotalCount: 0,
  taskForm: {},
  taskResultsData: [],
  taskResultsColumns: [],
  taskResultsTotalCount: 0,
  // filter
  filter: {
    spider_id: '',
    status: '',
    schedule_id: ''
  },
  // pagination
  pageNum: 1,
  pageSize: 10,
  // log
  currentLogIndex: 0,
  logKeyword: '',
  errorLogData: [],
  isLogAutoScroll: false,
  isLogAutoFetch: false,
  isLogFetchLoading: false,
  taskLog: [],
  taskLogTotal: 0,
  taskLogPage: 1,
  taskLogPageSize: 5000,
  activeErrorLogItem: {},
  // results
  resultsPageNum: 1,
  resultsPageSize: 10
}

const getters = {
  taskResultsColumns(state) {
    if (!state.taskResultsData || !state.taskResultsData.length) {
      return []
    }
    const keys = []
    const item = state.taskResultsData[0]
    for (const key in item) {
      keys.push(key)
    }
    return keys
  },
  logData(state) {
    const data = state.taskLog
      .map((d, i) => {
        return {
          index: i + 1,
          active: state.currentLogIndex === i + 1,
          data: d.msg,
          ...d
        }
      })
    if (state.taskForm && state.taskForm.status === 'running') {
      data.push({
        index: data.length + 1,
        data: '###LOG_END###'
      })
      data.push({
        index: data.length + 1,
        data: ''
      })
    }
    return data
  },
  errorLogData(state, getters) {
    const idxList = getters.logData.map(d => d.id)
    return state.errorLogData.map(d => {
      const idx = idxList.indexOf(d.id)
      d.index = getters.logData[idx].index
      return d
    })
  }
}

const mutations = {
  SET_TASK_FORM(state, value) {
    state.taskForm = value
  },
  SET_TASK_LIST(state, value) {
    state.taskList = value
  },
  SET_TASK_LOG(state, value) {
    state.taskLog = value
  },
  SET_TASK_LOG_TOTAL(state, value) {
    state.taskLogTotal = value
  },
  SET_CURRENT_LOG_INDEX(state, value) {
    state.currentLogIndex = value
  },
  SET_TASK_RESULTS_DATA(state, value) {
    state.taskResultsData = value
  },
  SET_TASK_RESULTS_COLUMNS(state, value) {
    state.taskResultsColumns = value
  },
  SET_PAGE_NUM(state, value) {
    state.pageNum = value
  },
  SET_PAGE_SIZE(state, value) {
    state.pageSize = value
  },
  SET_TASK_LIST_TOTAL_COUNT(state, value) {
    state.taskListTotalCount = value
  },
  SET_RESULTS_PAGE_NUM(state, value) {
    state.resultsPageNum = value
  },
  SET_RESULTS_PAGE_SIZE(state, value) {
    state.resultsPageSize = value
  },
  SET_TASK_RESULTS_TOTAL_COUNT(state, value) {
    state.taskResultsTotalCount = value
  },
  SET_LOG_KEYWORD(state, value) {
    state.logKeyword = value
  },
  SET_ERROR_LOG_DATA(state, value) {
    state.errorLogData = value
  },
  SET_TASK_LOG_PAGE(state, value) {
    state.taskLogPage = value
  },
  SET_TASK_LOG_PAGE_SIZE(state, value) {
    state.taskLogPageSize = value
  },
  SET_IS_LOG_AUTO_SCROLL(state, value) {
    state.isLogAutoScroll = value
  },
  SET_IS_LOG_AUTO_FETCH(state, value) {
    state.isLogAutoFetch = value
  },
  SET_IS_LOG_FETCH_LOADING(state, value) {
    state.isLogFetchLoading = value
  },
  SET_ACTIVE_ERROR_LOG_ITEM(state, value) {
    state.activeErrorLogItem = value
  },
  SET_FILTER(state, value) {
    state.filter = value
  }
}

const actions = {
  getTaskData({ state, dispatch, commit }, id) {
    return request.get(`/tasks/${id}`)
      .then(response => {
        const data = response.data.data
        commit('SET_TASK_FORM', data)
        dispatch('spider/getSpiderData', data.spider_id, { root: true })
      })
  },
  getTaskList({ state, commit }) {
    return request.get('/tasks', {
      page_num: state.pageNum,
      page_size: state.pageSize,
      spider_id: state.filter.spider_id || undefined,
      status: state.filter.status || undefined,
      schedule_id: state.filter.schedule_id || undefined
    })
      .then(response => {
        if (!response || !response.data || !response.data.data) {
          return
        }
        commit('SET_TASK_LIST', response.data.data.list || [])
        commit('SET_TASK_LIST_TOTAL_COUNT', response.data.data.total || 0)
      })
  },
  deleteTask({ state, dispatch }, id) {
    return request.delete(`/tasks/${id}`)
      .then(() => {
        dispatch('getTaskList')
      })
  },
  deleteTaskMultiple({ state }, ids) {
    return request.delete(`/tasks`, {
      ids: ids
    })
  },
  restartTask({ state, dispatch }, id) {
    return request.post(`/tasks/${id}/restart`)
      .then(() => {
        dispatch('getTaskList')
      })
  },
  getTaskLog({ state, commit }, { id, keyword }) {
    return request.get(`/tasks/${id}/log`, {
      keyword,
      page_num: state.taskLogPage,
      page_size: state.taskLogPageSize
    })
      .then(response => {
        if (!response || !response.data || !response.data.data) {
          return
        }
        commit('SET_TASK_LOG', response.data.data.list || [])
        commit('SET_TASK_LOG_TOTAL', response.data.data.total || 0)

        // auto switch to next page if not reaching the end
        if (state.isLogAutoScroll && state.taskLogTotal > (state.taskLogPage * state.taskLogPageSize)) {
          commit('SET_TASK_LOG_PAGE', Math.ceil(state.taskLogTotal / state.taskLogPageSize))
        }
      })
  },
  getTaskErrorLog({ state, commit }, id) {
    return request.get(`/tasks/${id}/error-log`, {})
      .then(response => {
        if (!response || !response.data || !response.data.data) {
          return
        }
        commit('SET_ERROR_LOG_DATA', response.data.data.list || [])
      })
  },
  getTaskResults({ state, commit }, id) {
    return request.get(`/tasks/${id}/results`, {
      page_num: state.resultsPageNum,
      page_size: state.resultsPageSize
    })
      .then(response => {
        if (!response || !response.data || !response.data.data) {
          return
        }
        commit('SET_TASK_RESULTS_DATA', response.data.data.list || [])
        commit('SET_TASK_RESULTS_TOTAL_COUNT', response.data.data.total || 0)
      })
  },
  cancelTask({ state, dispatch }, id) {
    return new Promise(resolve => {
      request.post(`/tasks/${id}/cancel`)
        .then(res => {
          dispatch('getTaskData', id)
          resolve(res)
        })
    })
  },
  resetFilter({ state, commit }) {
    commit('SET_FILTER', {})
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}