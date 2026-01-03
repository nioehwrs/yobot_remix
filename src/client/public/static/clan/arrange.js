var vm = new Vue({
    el: '#app',
    data: {
        knifeList: { 2: [], 3: [], 4: [] },
        activeIndex: '2',
    },
    mounted() {
        document.title = '排刀列表 - 公会战';
        this.loadKnifeData();
    },
    methods: {
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
            var emptyDiv = document.getElementById('knife-empty');
            var container = document.getElementById('knife-container');
            
            var totalCount = (this.knifeList[2] || []).length + (this.knifeList[3] || []).length + (this.knifeList[4] || []).length;
            
            if (totalCount === 0) {
                emptyDiv.style.display = 'block';
                container.style.display = 'none';
                return;
            }
            
            emptyDiv.style.display = 'none';
            container.style.display = 'block';
            
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
    },
    watch: {
        knifeList: {
            handler(newVal, oldVal) {
            },
            deep: true
        }
    }
})
