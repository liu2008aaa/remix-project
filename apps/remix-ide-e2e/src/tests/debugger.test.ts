'use strict'
import { NightwatchBrowser } from 'nightwatch'
import init from '../helpers/init'
import sauce from './sauce'

module.exports = {

  before: function (browser: NightwatchBrowser, done: VoidFunction) {
    init(browser, done)
  },

  '@sources': function () {
    return sources
  },

  'Should launch debugger': function (browser: NightwatchBrowser) {
    browser.addFile('blah.sol', sources[0]['browser/blah.sol'])
    .clickLaunchIcon('udapp')
    .waitForElementPresent('*[title="Deploy - transact (not payable)"]')
    .click('*[title="Deploy - transact (not payable)"]')
    .debugTransaction(0)
    .assert.containsText('*[data-id="sidePanelSwapitTitle"]', 'DEBUGGER')
  },

  'Should debug failing transaction': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('*[data-id="verticalIconsKindudapp"]')
    .clickLaunchIcon('udapp')
    .waitForElementPresent('*[data-id="universalDappUiTitleExpander"]')
    .click('*[data-id="universalDappUiTitleExpander"]')
    .scrollAndClick('*[title="string name, uint256 goal"]')
    .setValue('*[title="string name, uint256 goal"]', '"toast", 999')
    .click('*[data-id="createProject - transact (not payable)"]')
    .debugTransaction(1)
    .pause(2000)
    .scrollAndClick('*[data-id="solidityLocals"]')
    .assert.containsText('*[data-id="solidityLocals"]', 'toast')
    .assert.containsText('*[data-id="solidityLocals"]', '999')
  },

  'Should debug transaction using slider': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('*[data-id="verticalIconsKindudapp"]')
    .waitForElementVisible('*[data-id="slider"]')
    .click('*[data-id="slider"]')
    .setValue('*[data-id="slider"]', '50')
    .pause(2000)
    .assert.containsText('*[data-id="solidityLocals"]', 'no locals')
    .assert.containsText('*[data-id="stepdetail"]', 'vm trace step:\n92')
  },

  'Should step back and forward transaction': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('*[data-id="verticalIconsKindudapp"]')
    .waitForElementPresent('*[data-id="buttonNavigatorIntoBack"]')
    .scrollAndClick('*[data-id="buttonNavigatorIntoBack"]')
    .pause(2000)
    .assert.containsText('*[data-id="stepdetail"]', 'vm trace step:\n91')
    .assert.containsText('*[data-id="stepdetail"]', 'execution step:\n91')
    .click('*[data-id="buttonNavigatorIntoForward"]')
    .pause(2000)
    .assert.containsText('*[data-id="stepdetail"]', 'vm trace step:\n92')
    .assert.containsText('*[data-id="stepdetail"]', 'execution step:\n92')
  },

  'Should jump through breakpoints': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('*[data-id="editorInput"]')
    .click('.ace_gutter-cell:nth-of-type(10)')
    .click('.ace_gutter-cell:nth-of-type(20)')
    .waitForElementVisible('*[data-id="buttonNavigatorJumpPreviousBreakpoint"]')
    .click('*[data-id="buttonNavigatorJumpPreviousBreakpoint"]')
    .pause(2000)
    .assert.containsText('*[data-id="stepdetail"]', 'vm trace step:\n0')
    .assert.containsText('*[data-id="stepdetail"]', 'execution step:\n0')
    .click('*[data-id="buttonNavigatorJumpNextBreakpoint"]')
    .pause(2000)
    .assert.containsText('*[data-id="stepdetail"]', 'vm trace step:\n184')
    .assert.containsText('*[data-id="stepdetail"]', 'execution step:\n184')    
  },

  'Should debug using generated sources': function (browser: NightwatchBrowser) {
    browser
    .clickLaunchIcon('solidity')
    .setSolidityCompilerVersion('soljson-v0.7.2+commit.51b20bc0.js')
    .clickLaunchIcon('udapp')    
    .testContracts('withGeneratedSources.sol', sources[1]['browser/withGeneratedSources.sol'], ['A'])
    .createContract('')
    .clickInstance(1)
    .clickFunction('f - transact (not payable)', {types: 'uint256[] ', values: '[]'})
    .debugTransaction(3)
    .pause(2000)
    .click('*[data-id="debuggerTransactionStartButton"]') // stop debugging
    .click('*[data-id="debugGeneratedSourcesLabel"]') // select debug with generated sources
    .click('*[data-id="debuggerTransactionStartButton"]') // start debugging
    .pause(2000)
    .getEditorValue((content) => {
      browser.assert.ok(content.indexOf('if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }') != -1, 'current displayed content is not a generated source')
    })
    .end()
  },

  tearDown: sauce
}

const sources = [
  {
    'browser/blah.sol': {
      content: `
    pragma solidity >=0.4.22 <0.6.0;

    contract Kickstarter {

        enum State { Started, Completed }

        struct Project {
            address owner;
            string name;
            uint goal;
            State state;
        }    

        Project[] public projects;    

        constructor() public {

        }    

        function createProject(string memory name, uint goal) public {
            Project storage project = projects[projects.length];
            project.name = name;
            project.owner = msg.sender;
            project.state = State.Started;
            project.goal = goal;
        }
    }
        `
    }
  },
  {
    'browser/withGeneratedSources.sol': {
      content: `
      // SPDX-License-Identifier: GPL-3.0
      pragma experimental ABIEncoderV2; 
      contract A { 
        function f(uint[] memory) public returns (uint256) { } 
      }
      `
    }
  }
]
