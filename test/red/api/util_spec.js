/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var should = require("should");
var request = require('supertest');
var express = require('express');

var apiUtil = require("../../../red/api/util");

describe("api/util", function() {
    describe("errorHandler", function() {
        var loggedError = null;
        var loggedEvent = null;
        var app;
        before(function() {
            app = express();
            apiUtil.init({
                log:{
                    error: function(msg) {
                        loggedError = msg;
                    },
                    audit: function(event) {
                        loggedEvent = event;
                    }
                },
                i18n:{}
            })
            app.get("/tooLarge", function(req,res) {
                var err = new Error();
                err.message = "request entity too large";
                throw err;
            },apiUtil.errorHandler)
            app.get("/stack", function(req,res) {
                var err = new Error();
                err.message = "stacktrace";
                throw err;
            },apiUtil.errorHandler)
        });
        beforeEach(function() {
            loggedError = null;
            loggedEvent = null;
        })
        it("logs an error for request entity too large", function(done) {
            request(app).get("/tooLarge").expect(400).end(function(err,res) {
                if (err) {
                    return done(err);
                }
                res.body.should.have.property("error","unexpected_error");
                res.body.should.have.property("message","Error: request entity too large");

                loggedError.should.have.property("message","request entity too large");

                loggedEvent.should.have.property("event","api.error");
                loggedEvent.should.have.property("error","unexpected_error");
                loggedEvent.should.have.property("message","Error: request entity too large");
                done();
            });
        })
        it("logs an error plus stack for other errors", function(done) {
            request(app).get("/stack").expect(400).end(function(err,res) {
                if (err) {
                    return done(err);
                }
                res.body.should.have.property("error","unexpected_error");
                res.body.should.have.property("message","Error: stacktrace");

                /Error: stacktrace\s*at.*util_spec.js/m.test(loggedError).should.be.true();

                loggedEvent.should.have.property("event","api.error");
                loggedEvent.should.have.property("error","unexpected_error");
                loggedEvent.should.have.property("message","Error: stacktrace");



                done();
            });
        });
    })

    describe('determineLangFromHeaders', function() {
        before(function() {
            apiUtil.init({
                log:{},
                i18n:{defaultLang:"en-US"}
            });
        })
        it('returns the default lang if non provided', function() {
            apiUtil.determineLangFromHeaders(null).should.eql("en-US");
        })
        it('returns the first language accepted', function() {
            apiUtil.determineLangFromHeaders(['fr-FR','en-GB']).should.eql("fr-FR");
        })
    })
});
