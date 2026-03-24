var CONFIG = {
    X: { min: 5, max: 40, defaultDay1: 14, defaultDay2to5: 18 },
    A: { options: [1, 2, 3, 4, 5, 6] },
    B: { options: [0, 1, 2, 3] },
    C: { options: [2, 3, 4] },
    E: { day1: 70, day2to5: 90 },
    DAYS: [1, 2, 3, 4, 5],
    BOSSES: [1, 2, 3, 4, 5]
};

var VERSION = '2.1.0';

function getVersion() {
    return VERSION;
}

function generateVersion() {
    var now = new Date();
    var major = 2;
    var minor = now.getFullYear() - 2024;
    var patch = now.getMonth() + 1;
    return major + '.' + minor + '.' + patch;
}

var vm = new Vue({
    el: '#app',
    data: {
        knifeList: { 2: [], 3: [], 4: [] },
        activeIndex: '2',
        bossData: { 1:{icon_id:0}, 2:{icon_id:0}, 3:{icon_id:0}, 4:{icon_id:0}, 5:{icon_id:0} },
        base_cycle: 1,
        days: CONFIG.DAYS,
        bosses: CONFIG.BOSSES,
        statsConfig: {},
        dayStats: {},
        dayResult: {},
        tableData: Array.from({ length: 30 }, (_, i) => ({
            index: i + 1,
            nickname: '',
            remark: '',
            selectedCells: []
        }))
    },
    mounted() {
        document.title = '排刀列表 - 公会战';
        this.loadKnifeData();
        this.loadBossData();
        this.initStatsConfig();
        this.loadStatsData();
        this.loadDayStatsData();
    },
    methods: {
        selectCell(rowIndex, cellType, event) {
            var row = this.tableData[rowIndex - 1];
            var ctrlPressed = event && event.ctrlKey;
            var shiftPressed = event && event.shiftKey;
            
            if (ctrlPressed && shiftPressed) {
                ctrlPressed = false;
                shiftPressed = false;
            }
            
            var thisvue = this;
            var cellKey = rowIndex + '-' + cellType;
            
            function getColumn(cell) {
                return cell.split('-')[0] + '-' + cell.split('-')[1];
            }
            
            function isSameColumn(cell1, cell2) {
                return getColumn(cell1) === getColumn(cell2);
            }
            
            if (!ctrlPressed && !shiftPressed) {
                var allSelected = [];
                this.tableData.forEach(function(r) {
                    r.selectedCells.forEach(function(c) {
                        allSelected.push(r.index + '-' + c);
                    });
                });
                
                if (allSelected.length === 1 && allSelected[0] === cellKey) {
                    row.selectedCells = [];
                } else {
                    thisvue.tableData.forEach(function(r) {
                        r.selectedCells = [];
                    });
                    row.selectedCells = [cellType];
                }
            } else if (ctrlPressed && !shiftPressed) {
                var allSelected = [];
                this.tableData.forEach(function(r) {
                    r.selectedCells.forEach(function(c) {
                        allSelected.push({ row: r.index, cell: c });
                    });
                });
                
                if (allSelected.length === 1 && isSameColumn(allSelected[0].cell, cellType)) {
                    var startRow = allSelected[0].row;
                    var endRow = rowIndex;
                    var minRow = Math.min(startRow, endRow);
                    var maxRow = Math.max(startRow, endRow);
                    var column = getColumn(cellType);
                    
                    thisvue.tableData.forEach(function(r) {
                        r.selectedCells = [];
                    });
                    
                    for (var r = minRow; r <= maxRow; r++) {
                        thisvue.tableData[r - 1].selectedCells = [column];
                    }
                }
            } else if (!ctrlPressed && shiftPressed) {
                var idx = row.selectedCells.indexOf(cellType);
                if (idx >= 0) {
                    row.selectedCells.splice(idx, 1);
                } else {
                    row.selectedCells.push(cellType);
                }
            }
        },
        isCellSelected(rowIndex, cellType) {
            var row = this.tableData[rowIndex - 1];
            return row && row.selectedCells && row.selectedCells.indexOf(cellType) >= 0;
        },
        loadBossData() {
            var thisvue = this;
            axios.post("../api/", {
                action: 'get_data',
                csrf_token: csrf_token,
            }).then(function (res) {
                if (res.data.code == 0) {
                    thisvue.bossData = res.data.bossData;
                    thisvue.base_cycle = res.data.groupData.cycle;
                } else {
                    console.error('加载boss数据失败:', res.data.message);
                }
            }).catch(function (error) {
                console.error('加载boss数据错误:', error);
            });
        },
        loadKnifeData() {
            var thisvue = this;
            console.log('开始加载刀型数据...');
            axios.post("../api/", {
                action: 'get_knife_list',
                csrf_token: csrf_token,
            }).then(function (res) {
                console.log('加载响应:', res.data);
                if (res.data.code == 0) {
                    var data = res.data.knifeList || [];
                    if (Array.isArray(data)) {
                        thisvue.knifeList = thisvue.migrateOldFormat(data);
                    } else {
                        thisvue.knifeList = data;
                    }
                    console.log('刀型数据:', thisvue.knifeList);
                    thisvue.renderKnifeData();
                } else {
                    console.error('加载失败:', res.data.message);
                }
            }).catch(function (error) {
                console.error('加载错误:', error);
            });
        },
        migrateOldFormat(oldList) {
            var newFormat = { 2: [], 3: [], 4: [] };
            for (var i = 0; i < oldList.length; i++) {
                var item = oldList[i];
                var phase = item.phase || 2;
                if (!newFormat[phase]) {
                    newFormat[phase] = [];
                }
                newFormat[phase].push(item);
            }
            return newFormat;
        },
        saveKnifeData() {
            var thisvue = this;
            axios.post("../api/", {
                action: 'save_knife_list',
                knifeList: thisvue.knifeList,
                csrf_token: csrf_token,
            }).then(function (res) {
                console.log('保存响应:', res.data);
                if (res.data.code == 0) {
                    thisvue.$message.success(res.data.notice || '保存成功');
                } else {
                    thisvue.$message.error(res.data.message || '保存失败');
                }
            }).catch(function (error) {
                console.error('保存错误:', error);
                thisvue.$message.error('保存失败: ' + (error.response?.data?.message || error.message));
            });
        },
        renderKnifeData() {
            for (var phase = 2; phase <= 4; phase++) {
                this.renderPhase(phase);
            }
        },
        renderPhase(phase) {
            var phaseContainer = document.getElementById('knife-phase-' + phase);
            var emptyDiv = document.getElementById('knife-phase-' + phase + '-empty');
            var phaseList = this.knifeList[phase] || [];
            
            if (phaseList.length === 0) {
                emptyDiv.style.display = 'block';
                return;
            }
            
            emptyDiv.style.display = 'none';
            
            var html = '';
            for (var i = 0; i < phaseList.length; i++) {
                html += this.generatePhaseKnifeHtml(phase, i, phaseList[i]);
            }
            phaseContainer.insertAdjacentHTML('beforeend', html);
        },
        insertKnife(phase) {
            if (!this.knifeList[phase]) {
                this.knifeList[phase] = [];
            }
            this.knifeList[phase].push({
                boss_num: 1,
                team: '',
                damage_type: 'damage',
                value: null
            });
            this.saveKnifeData();
            this.$nextTick(() => {
                setTimeout(() => {
                    this.renderPhaseKnives(phase);
                }, 100);
            });
        },
        renderPhaseKnives(phase) {
            var phaseContainer = document.getElementById('knife-phase-' + phase);
            if (!phaseContainer) {
                return;
            }
            var phaseList = this.knifeList[phase] || [];
            var emptyDiv = document.getElementById('knife-phase-' + phase + '-empty');
            
            phaseContainer.innerHTML = '';
            
            if (emptyDiv) {
                emptyDiv.style.display = phaseList.length === 0 ? 'block' : 'none';
            }
            
            for (var i = 0; i < phaseList.length; i++) {
                phaseContainer.insertAdjacentHTML('beforeend', this.generatePhaseKnifeHtml(phase, i, phaseList[i]));
            }
        },
        deleteKnife(phase, index) {
            this.$confirm('确定删除这条刀型?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.knifeList[phase].splice(index, 1);
                this.saveKnifeData();
                this.renderPhaseKnives(phase);
                this.$message({
                    type: 'success',
                    message: '删除成功'
                });
            }).catch(() => {
            });
        },
        renderSingleKnife(phase, index) {
            var phaseContainer = document.getElementById('knife-phase-' + phase);
            var emptyDiv = document.getElementById('knife-phase-' + phase + '-empty');
            var phaseList = this.knifeList[phase] || [];
            
            if (phaseList.length === 0) {
                if (emptyDiv) emptyDiv.style.display = 'block';
                return;
            }
            
            if (emptyDiv) emptyDiv.style.display = 'none';
            
            var existingRows = phaseContainer.querySelectorAll('.knife-row');
            var existingRow = existingRows[index];
            var newHtml = this.generatePhaseKnifeHtml(phase, index, phaseList[index]);
            
            if (existingRow) {
                existingRow.outerHTML = newHtml;
            } else {
                phaseContainer.insertAdjacentHTML('beforeend', newHtml);
            }
        },
        generatePhaseKnifeHtml(phase, index, item) {
            var unitLabel = item.damage_type === 'damage' ? 'w' : 's';
            var bossLabels = ['1号', '2号', '3号', '4号', '5号'];
            var currentBoss = bossLabels[(item.boss_num || 1) - 1] || '1号';
            return '<div class="knife-row" data-phase="' + phase + '" data-index="' + index + '">' +
                '<select class="boss-select" onchange="vm.updateKnife(' + phase + ', ' + index + ', \'boss_num\', parseInt(this.value))">' +
                    '<option value="1"' + (item.boss_num == 1 ? ' selected' : '') + '>1号</option>' +
                    '<option value="2"' + (item.boss_num == 2 ? ' selected' : '') + '>2号</option>' +
                    '<option value="3"' + (item.boss_num == 3 ? ' selected' : '') + '>3号</option>' +
                    '<option value="4"' + (item.boss_num == 4 ? ' selected' : '') + '>4号</option>' +
                    '<option value="5"' + (item.boss_num == 5 ? ' selected' : '') + '>5号</option>' +
                '</select>' +
                '<input type="text" class="team-input" placeholder="输入阵容" onchange="vm.updateKnife(' + phase + ', ' + index + ', \'team\', this.value)" value="' + (item.team || '') + '">' +
                '<select class="damage-select" onchange="vm.updateKnife(' + phase + ', ' + index + ', \'damage_type\', this.value)">' +
                    '<option value="damage"' + (item.damage_type === 'damage' ? ' selected' : '') + '>伤害</option>' +
                    '<option value="time"' + (item.damage_type === 'time' ? ' selected' : '') + '>返秒</option>' +
                '</select>' +
                '<div class="value-wrapper">' +
                    '<input type="number" placeholder="数值" class="value-input" onchange="vm.updateKnife(' + phase + ', ' + index + ', \'value\', this.value)" value="' + (item.value || '') + '">' +
                    '<span id="unit-' + phase + '-' + index + '" class="unit-label">' + unitLabel + '</span>' +
                '</div>' +
                '<button type="button" class="el-button el-button--danger is-circle delete-btn" onclick="vm.deleteKnife(' + phase + ', ' + index + ')">' +
                    '<i class="el-icon-delete"></i>' +
                '</button>' +
            '</div>';
        },
        editTeam(phase, index) {
            var item = this.knifeList[phase][index];
            var newTeam = prompt('请输入阵容:', item.team || '');
            if (newTeam !== null) {
                this.updateKnife(phase, index, 'team', newTeam);
                this.renderPhaseKnives(phase);
            }
        },
        updateKnife(phase, index, field, value) {
            if (this.knifeList[phase] && this.knifeList[phase][index]) {
                if (field === 'boss_num' || field === 'value') {
                    this.knifeList[phase][index][field] = parseInt(value) || value;
                } else if (field === 'damage_type') {
                    this.knifeList[phase][index][field] = value;
                    var unitLabel = value === 'damage' ? 'w' : 's';
                    var unitElement = document.getElementById('unit-' + phase + '-' + index);
                    if (unitElement) {
                        unitElement.textContent = unitLabel;
                    }
                } else {
                    this.knifeList[phase][index][field] = value;
                }
                this.saveKnifeData();
            }
        },
        handleSelect(key, keyPath) {
            switch (key) {
                case '1':
                    window.location = '../';
                    break;
                case '2':
                    window.location = '../arrange/';
                    break;
                case '3':
                    window.location = '../progress/';
                    break;
                case '4':
                    window.location = '../statistics/';
                    break;
                case '5':
                    window.location = `../my/`;
                    break;
                case '6':
                    window.location = `../clan-rank/`;
                    break;
            }
        },
        initStatsConfig() {
            for (var day = 1; day <= 5; day++) {
                this.statsConfig[day] = {};
                for (var boss = 1; boss <= 5; boss++) {
                    var defaultX = day === 1 ? CONFIG.X.defaultDay1 : CONFIG.X.defaultDay2to5;
                    this.statsConfig[day][boss] = {
                        a: 1,
                        b: 0,
                        c: 2,
                        x: defaultX,
                        tail: 'full',
                        ax: 0,
                        bx: 0,
                        cx: 2
                    };
                }
            }
            this.initDayStats();
        },
        initDayStats() {
            for (var day = 1; day <= 5; day++) {
                this.dayStats[day] = { locked: false, usePrevious: false };
            }
        },
        updateStats(day, boss, field, value) {
            if (!this.statsConfig[day]) {
                this.$set(this.statsConfig, day, {});
            }
            if (!this.statsConfig[day][boss]) {
                this.$set(this.statsConfig[day], boss, { a: 1, b: 0, c: 2, x: 20, tail: 'full' });
            }
            
            var currentConfig = this.statsConfig[day][boss];
            var shouldRecalculate = false;
            
            if (field === 'b') {
                var newB = parseInt(value) || 0;
                this.$set(currentConfig, 'b', newB);
                shouldRecalculate = true;
                if (newB >= currentConfig.c) {
                    this.$set(currentConfig, 'c', newB + 1);
                }
                document.getElementById('c-select-' + day + '-' + boss).value = currentConfig.c;
            } else if (field === 'c') {
                var newC = parseInt(value) || 2;
                this.$set(currentConfig, 'c', newC);
                shouldRecalculate = true;
                if (currentConfig.b >= newC) {
                    this.$set(currentConfig, 'b', newC - 1);
                }
                document.getElementById('b-select-' + day + '-' + boss).value = currentConfig.b;
            } else if (field === 'a') {
                this.$set(currentConfig, 'a', parseInt(value) || 1);
                shouldRecalculate = true;
            } else if (field === 'x') {
                var newX = parseInt(value) || 20;
                if (newX < 5) newX = 5;
                if (newX > 40) newX = 40;
                this.$set(currentConfig, 'x', newX);
                shouldRecalculate = true;
                document.getElementById('x-input-' + day + '-' + boss).value = newX;
            } else if (field === 'tail') {
                this.$set(currentConfig, 'tail', value);
            } else if (field === 'ax') {
                this.$set(currentConfig, 'ax', parseInt(value) || 0);
                shouldRecalculate = true;
            } else if (field === 'bx') {
                var newBx = parseInt(value) || 0;
                this.$set(currentConfig, 'bx', newBx);
                shouldRecalculate = true;
                if (newBx >= currentConfig.cx) {
                    this.$set(currentConfig, 'cx', newBx + 1);
                }
                document.getElementById('cx-select-' + day + '-' + boss).value = currentConfig.cx;
            } else if (field === 'cx') {
                var newCx = parseInt(value) || 2;
                this.$set(currentConfig, 'cx', newCx);
                shouldRecalculate = true;
                if (currentConfig.bx >= newCx) {
                    this.$set(currentConfig, 'bx', newCx - 1);
                }
                document.getElementById('bx-select-' + day + '-' + boss).value = currentConfig.bx;
            }

            if (shouldRecalculate) {
                for (var clearDay = 1; clearDay <= 5; clearDay++) {
                    if (this.dayResult[clearDay]) {
                        this.$delete(this.dayResult[clearDay], boss);
                    }
                }
                for (var calcDay = 1; calcDay <= 5; calcDay++) {
                    this.getBossBlocks(calcDay, boss);
                }
            }

            this.saveStatsData();
        },
        saveStatsData() {
            var thisvue = this;
            axios.post("../api/", {
                action: 'save_stats_config',
                statsConfig: thisvue.statsConfig,
                csrf_token: csrf_token,
            }).then(function (res) {
                if (res.data.code == 0) {
                    console.log('统计配置保存成功');
                } else {
                    console.error('保存统计配置失败:', res.data.message);
                }
            }).catch(function (error) {
                console.error('保存统计配置错误:', error);
            });
        },
        loadStatsData() {
            var thisvue = this;
            axios.post("../api/", {
                action: 'get_stats_config',
                csrf_token: csrf_token,
            }).then(function (res) {
                if (res.data.code == 0 && res.data.statsConfig) {
                    thisvue.statsConfig = res.data.statsConfig;
                } else {
                    thisvue.initStatsConfig();
                }
            }).catch(function (error) {
                console.error('加载统计配置错误:', error);
                thisvue.initStatsConfig();
            });
        },
        getDayFTotal(day) {
            if (!this.statsConfig[day]) {
                return 0;
            }
            var total = 0;
            for (var boss = 1; boss <= 5; boss++) {
                if (this.statsConfig[day][boss] && this.statsConfig[day][boss].x) {
                    total += this.statsConfig[day][boss].x;
                }
            }
            return total;
        },
        getDayFClass(day) {
            var expectedE = day === 1 ? 70 : 90;
            var totalF = this.getDayFTotal(day);
            if (totalF < expectedE) {
                return 'less';
            } else if (totalF > expectedE) {
                return 'more';
            }
            return 'normal';
        },
        getExpectedE(day) {
            return day === 1 ? 70 : 90;
        },
        toggleDayLock(day) {
            if (!this.dayStats[day]) {
                this.$set(this.dayStats, day, { locked: false, usePrevious: false });
            }
            var newLocked = !this.dayStats[day].locked;
            this.$set(this.dayStats[day], 'locked', newLocked);
            if (newLocked) {
                this.$set(this.dayStats[day], 'usePrevious', false);
            }
            this.saveDayStatsData();
        },
        toggleUsePrevious(day) {
            if (!this.dayStats[day]) {
                this.$set(this.dayStats, day, { locked: false, usePrevious: false });
            }
            if (this.dayStats[day].locked) {
                return;
            }
            var newUsePrevious = !this.dayStats[day].usePrevious;
            this.$set(this.dayStats[day], 'usePrevious', newUsePrevious);
            if (newUsePrevious && day > 1) {
                this.copyFromPreviousDay(day);
            }
            this.saveDayStatsData();
        },
        copyFromPreviousDay(day) {
            if (day <= 1) return;
            var prevDay = day - 1;
            if (!this.statsConfig[prevDay]) return;
            if (!this.statsConfig[day]) {
                this.$set(this.statsConfig, day, {});
            }
            for (var boss = 1; boss <= 5; boss++) {
                if (this.statsConfig[prevDay][boss]) {
                    var defaultX = day === 1 ? CONFIG.X.defaultDay1 : CONFIG.X.defaultDay2to5;
                    this.$set(this.statsConfig[day], boss, {
                        a: this.statsConfig[prevDay][boss].a || 1,
                        b: this.statsConfig[prevDay][boss].b || 0,
                        c: this.statsConfig[prevDay][boss].c || 2,
                        x: this.statsConfig[prevDay][boss].x || defaultX,
                        tail: this.statsConfig[prevDay][boss].tail || 'full',
                        ax: this.statsConfig[prevDay][boss].ax || 0,
                        bx: this.statsConfig[prevDay][boss].bx || 0,
                        cx: this.statsConfig[prevDay][boss].cx || 2
                    });
                }
            }
            this.saveStatsData();
        },
        syncFromPreviousDay(day) {
            if (day <= 1) return;
            var prevDay = day - 1;
            if (!this.statsConfig[prevDay]) return;
            if (!this.statsConfig[day]) {
                this.$set(this.statsConfig, day, {});
            }
            for (var boss = 1; boss <= 5; boss++) {
                if (this.statsConfig[prevDay][boss]) {
                    if (!this.statsConfig[day][boss]) {
                        this.$set(this.statsConfig[day], boss, {});
                    }
                    var defaultX = day === 1 ? CONFIG.X.defaultDay1 : CONFIG.X.defaultDay2to5;
                    var source = this.statsConfig[prevDay][boss];
                    this.$set(this.statsConfig[day][boss], 'a', source.a || 1);
                    this.$set(this.statsConfig[day][boss], 'b', source.b || 0);
                    this.$set(this.statsConfig[day][boss], 'c', source.c || 2);
                    this.$set(this.statsConfig[day][boss], 'x', source.x || defaultX);
                    this.$set(this.statsConfig[day][boss], 'tail', source.tail || 'full');
                    this.$set(this.statsConfig[day][boss], 'ax', source.ax || 0);
                    this.$set(this.statsConfig[day][boss], 'bx', source.bx || 0);
                    this.$set(this.statsConfig[day][boss], 'cx', source.cx || 2);
                }
            }
        },
        getBossBlocks(day, boss) {
            if (!this.statsConfig[day] || !this.statsConfig[day][boss]) {
                return null;
            }
            var config = this.statsConfig[day][boss];
            var x = config.x || (day === 1 ? 14 : 18);
            var a = config.a || 1;
            var b = config.b || 0;
            var c = config.c || 2;
            var ax = config.ax || 0;
            var bx = config.bx || 0;
            var cx = config.cx || 2;

            if (!this.dayResult[day]) {
                this.dayResult[day] = {};
            }

            if (this.dayResult[day][boss]) {
                return this.dayResult[day][boss];
            }

            var BLOCK_VALUE = 12;
            var F = x * BLOCK_VALUE;
            var D = a * BLOCK_VALUE + b * BLOCK_VALUE / c;

            var result;
            if (day === 1) {
                result = this.calcDay1(boss, x, a, b, c);
            } else {
                result = this.calcDayN(boss, day, x, a, b, c, ax, bx, cx);
            }

            this.$set(this.dayResult[day], boss, result);

            // if (day === 5 && boss === 3) {
            //     console.log('=== Day 1-5 Boss 3 dayResult ===');
            //     for (var d = 1; d <= 5; d++) {
            //         if (this.dayResult[d] && this.dayResult[d][3]) {
            //             console.log('Day ' + d + ':', JSON.parse(JSON.stringify(this.dayResult[d][3])));
            //         }
            //     }
            // }

            return result;
        },
        calcDay1(boss, x, a, b, c) {
            var BLOCK_VALUE = 12;
            var F = x * BLOCK_VALUE;
            var D = a * BLOCK_VALUE + b * BLOCK_VALUE / c;

            var result = {
                D: D, F: F,
                G: Math.floor(F / D),
                H: F % D,
                J: 23,
                rows: [],
                maxWidth: 0,
                maxCycle: 0
            };

            var rows = [];
            var maxWidth = 0;

            for (var i = 0; i < result.G; i++) {
                var cycle = result.J + i;
                var blocks = [];
                var rowWidth = 0;

                var P = BLOCK_VALUE - ((D * i - 1) % BLOCK_VALUE) - 1;
                var remainingAfterP = D - P;
                var Q = Math.floor(remainingAfterP / BLOCK_VALUE);
                var R = remainingAfterP % BLOCK_VALUE;

                if (P > 0.01) {
                    var P_width = P / BLOCK_VALUE;
                    blocks.push({ width: P_width, type: P >= BLOCK_VALUE - 0.01 ? 'full' : 'partial', numerator: Math.round(P_width * c), denominator: c });
                    rowWidth += P_width;
                }

                for (var qi = 0; qi < Q; qi++) {
                    blocks.push({ width: 1, type: 'full' });
                    rowWidth += 1;
                }

                if (R > 0.01) {
                    var R_width = R / BLOCK_VALUE;
                    blocks.push({ width: R_width, type: 'partial', numerator: Math.round(R_width * c), denominator: c });
                    rowWidth += R_width;
                }

                rows.push({ cycle: cycle, blocks: blocks });
                maxWidth = Math.max(maxWidth, rowWidth);
            }

            if (result.H > 0.01) {
                var finalCycle = result.J + result.G;
                var blocks = [];
                var rowWidth = 0;

                var S = Math.min(BLOCK_VALUE - ((D * result.G - 1) % BLOCK_VALUE) - 1, result.H);
                var remainingAfterS = result.H - S;
                var T = Math.floor(remainingAfterS / BLOCK_VALUE);
                var U = remainingAfterS % BLOCK_VALUE;

                if (S > 0.01) {
                    var S_width = S / BLOCK_VALUE;
                    if (S >= BLOCK_VALUE - 0.01) {
                        blocks.push({ width: 1, type: 'full' });
                        rowWidth += 1;
                    } else {
                        blocks.push({ width: S_width, type: 'partial', numerator: Math.round(S_width * c), denominator: c });
                        rowWidth += S_width;
                    }
                }

                for (var ti = 0; ti < T; ti++) {
                    blocks.push({ width: 1, type: 'full' });
                    rowWidth += 1;
                }

                if (U > 0.01) {
                    var U_width = U / BLOCK_VALUE;
                    blocks.push({ width: U_width, type: 'partial', numerator: Math.round(U_width * c), denominator: c });
                    rowWidth += U_width;
                }

                rows.push({ cycle: finalCycle, blocks: blocks });
                maxWidth = Math.max(maxWidth, rowWidth);
            }

            result.rows = rows;
            result.maxWidth = maxWidth;
            result.maxCycle = rows.length > 0 ? rows[rows.length - 1].cycle : 0;

            return result;
        },
        calcDayN(boss, day, x, a, b, c, ax, bx, cx) {
            var BLOCK_VALUE = 12;
            var F = x * BLOCK_VALUE;
            var D = a * BLOCK_VALUE + b * BLOCK_VALUE / c;
            
            var FPrime = F + ax * BLOCK_VALUE + bx * BLOCK_VALUE / cx;

            var fullCyclesPrev = 0;
            for (var d = 1; d < day; d++) {
                if (this.dayResult[d] && this.dayResult[d][boss]) {
                    fullCyclesPrev += this.dayResult[d][boss].G;
                }
            }

            var prevDay = day - 1;
            var HPrev = 0;
            if (this.dayResult[prevDay] && this.dayResult[prevDay][boss]) {
                HPrev = this.dayResult[prevDay][boss].H;
            }

            var J = fullCyclesPrev + 22 + (day - 1);
            var G = Math.floor((FPrime + HPrev) / D) - 1;
            var K = D - HPrev;
            var H = (FPrime + HPrev) % D;

            var result = {
                D: D, F: F, FPrime: FPrime, G: G, H: H, J: J, K: K,
                rows: [],
                maxWidth: 0,
                maxCycle: 0
            };

            var rows = [];
            var maxWidth = 0;

            var blocks = [];
            var rowWidth = 0;

            var S = Math.min(BLOCK_VALUE - ((D * (J + 1) - HPrev - 1) % BLOCK_VALUE) - 1, HPrev);
            var remainingAfterS = HPrev - S;
            var T = Math.floor(remainingAfterS / BLOCK_VALUE);
            var U = remainingAfterS % BLOCK_VALUE;

            if (S > 0.01) {
                var S_width = S / BLOCK_VALUE;
                if (S >= BLOCK_VALUE - 0.01) {
                    blocks.push({ width: 1, type: 'gray' });
                    rowWidth += 1;
                } else {
                    blocks.push({ width: S_width, type: 'gray' });
                    rowWidth += S_width;
                }
            }

            for (var ti = 0; ti < T; ti++) {
                blocks.push({ width: 1, type: 'gray' });
                rowWidth += 1;
            }

            if (U > 0.01) {
                var U_width = U / BLOCK_VALUE;
                blocks.push({ width: U_width, type: 'gray' });
                rowWidth += U_width;
            }

            var Y = Math.floor(K / BLOCK_VALUE);
            var Z = K % BLOCK_VALUE;

            for (var yi = 0; yi < Y; yi++) {
                blocks.push({ width: 1, type: 'full' });
                rowWidth += 1;
            }

            if (Z > 0.01) {
                var Z_width = Z / BLOCK_VALUE;
                blocks.push({ width: Z_width, type: 'partial', numerator: Math.round(Z_width * c), denominator: c });
                rowWidth += Z_width;
            }

            rows.push({ cycle: J, blocks: blocks });
            maxWidth = Math.max(maxWidth, rowWidth);

            for (var i = 0; i < G; i++) {
                var cycle = J + 1 + i;
                var rowBlocks = [];
                var rowW = 0;

                var P = BLOCK_VALUE - ((D * (i + 1) - HPrev - 1) % BLOCK_VALUE) - 1;
                var remainingAfterP = D - P;
                var Q = Math.floor(remainingAfterP / BLOCK_VALUE);
                var R = remainingAfterP % BLOCK_VALUE;

                if (P > 0.01) {
                    var P_width = P / BLOCK_VALUE;
                    rowBlocks.push({ width: P_width, type: P >= BLOCK_VALUE - 0.01 ? 'full' : 'partial', numerator: Math.round(P_width * c), denominator: c });
                    rowW += P_width;
                }

                for (var qi = 0; qi < Q; qi++) {
                    rowBlocks.push({ width: 1, type: 'full' });
                    rowW += 1;
                }

                if (R > 0.01) {
                    var R_width = R / BLOCK_VALUE;
                    rowBlocks.push({ width: R_width, type: 'partial', numerator: Math.round(R_width * c), denominator: c });
                    rowW += R_width;
                }

                rows.push({ cycle: cycle, blocks: rowBlocks });
                maxWidth = Math.max(maxWidth, rowW);
            }

            if (H > 0.01) {
                var finalCycle = J + 1 + G;
                var finalBlocks = [];
                var finalRowWidth = 0;

                var S2 = Math.min(BLOCK_VALUE - ((D * (G + 1) - HPrev - 1) % BLOCK_VALUE) - 1, H);
                var remainingAfterS2 = H - S2;
                var V = Math.floor(remainingAfterS2 / BLOCK_VALUE);
                var U2 = remainingAfterS2 % BLOCK_VALUE;

                if (S2 > 0.01) {
                    var S2_width = S2 / BLOCK_VALUE;
                    if (S2 >= BLOCK_VALUE - 0.01) {
                        finalBlocks.push({ width: 1, type: 'full' });
                        finalRowWidth += 1;
                    } else {
                        finalBlocks.push({ width: S2_width, type: 'partial', numerator: Math.round(S2_width * c), denominator: c });
                        finalRowWidth += S2_width;
                    }
                }

                for (var vi = 0; vi < V; vi++) {
                    finalBlocks.push({ width: 1, type: 'full' });
                    finalRowWidth += 1;
                }

                if (U2 > 0.01) {
                    var U2_width = U2 / BLOCK_VALUE;
                    finalBlocks.push({ width: U2_width, type: 'partial', numerator: Math.round(U2_width * c), denominator: c });
                    finalRowWidth += U2_width;
                }

                rows.push({ cycle: finalCycle, blocks: finalBlocks });
                maxWidth = Math.max(maxWidth, finalRowWidth);
            }

            result.rows = rows;
            result.maxWidth = maxWidth;
            result.maxCycle = rows.length > 0 ? rows[rows.length - 1].cycle : 0;

            return result;
        },
        getStartCycle(day) {
            if (day === 1) return 23;
            var startCycles = this.bosses.map(boss => {
                var result = this.getBossBlocks(day, boss);
                return result ? result.J : 23;
            });
            return Math.min(...startCycles);
        },
        getDayRemaining(day, boss) {
            if (day <= 1) return 0;
            if (!this.dayStats[day] || !this.dayStats[day][boss]) return 0;
            return this.dayStats[day][boss].remaining || 0;
        },
        saveRemaining(day, boss, value) {
            if (!this.dayStats[day]) {
                this.dayStats[day] = {};
            }
            if (!this.dayStats[day][boss]) {
                this.dayStats[day][boss] = {};
            }
            this.dayStats[day][boss].remaining = value;
        },
        saveDayStatsData() {
            var thisvue = this;
            axios.post("../api/", {
                action: 'save_day_stats',
                dayStats: thisvue.dayStats,
                csrf_token: csrf_token,
            }).then(function (res) {
                if (res.data.code == 0) {
                    console.log('日统计状态保存成功');
                } else {
                    console.error('保存日统计状态失败:', res.data.message);
                }
            }).catch(function (error) {
                console.error('保存日统计状态错误:', error);
            });
        },
        loadDayStatsData() {
            var thisvue = this;
            axios.post("../api/", {
                action: 'get_day_stats',
                csrf_token: csrf_token,
            }).then(function (res) {
                if (res.data.code == 0 && res.data.dayStats) {
                    thisvue.dayStats = res.data.dayStats;
                } else {
                    thisvue.initDayStats();
                }
            }).catch(function (error) {
                console.error('保存统计数据信息失败:', res.data.message);
                thisvue.$message.error('保存统计数据失败: ' + (res.data.message || '未知错误'));
                thisvue.initDayStats();
            });
        },
        initDayStats() {
            for (var day = 1; day <= 5; day++) {
                if (!this.dayStats[day]) {
                    this.$set(this.dayStats, day, { locked: false, usePrevious: false });
                }
            }
        },
        getCyclesToShow(day) {
            var startCycle = this.getStartCycle(day);
            var cycles = [];
            for (var boss = 1; boss <= 5; boss++) {
                var result = this.getBossBlocks(day, boss);
                if (result && result.maxCycle > 0) {
                    cycles.push(result.maxCycle);
                }
            }
            var maxCycle = cycles.length > 0 ? Math.max(...cycles) : startCycle;
            var resultCycles = [];
            for (var c = startCycle; c <= maxCycle; c++) {
                resultCycles.push(c);
            }
            return resultCycles;
        }
    },
    watch: {
        statsConfig: {
            handler(newStatsConfig, oldStatsConfig) {
                for (var day = 1; day <= 5; day++) {
                    if (this.dayStats[day] && this.dayStats[day].usePrevious) {
                        this.syncFromPreviousDay(day);
                    }
                }

                if (oldStatsConfig) {
                    for (var d = 1; d <= 5; d++) {
                        for (var boss = 1; boss <= 5; boss++) {
                            var oldCfg = oldStatsConfig[d] && oldStatsConfig[d][boss];
                            var newCfg = newStatsConfig[d] && newStatsConfig[d][boss];
                            if (oldCfg && newCfg) {
                                var oldX = oldCfg.x || (d === 1 ? 14 : 18);
                                var newX = newCfg.x || (d === 1 ? 14 : 18);
                                if (oldX !== newX || oldCfg.a !== newCfg.a || 
                                    oldCfg.b !== newCfg.b || oldCfg.c !== newCfg.c) {
                                    for (var clearDay = 1; clearDay <= 5; clearDay++) {
                                        if (this.dayResult[clearDay]) {
                                            this.$delete(this.dayResult[clearDay], boss);
                                        }
                                    }
                                    for (var calcDay = 1; calcDay <= 5; calcDay++) {
                                        this.getBossBlocks(calcDay, boss);
                                    }
                                }
                            }
                        }
                    }
                }
            },
            deep: true
        }
    }
})
