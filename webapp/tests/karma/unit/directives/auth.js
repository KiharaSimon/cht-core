describe('auth directive', () => {

  'use strict';

  let compile;
  let scope;
  let Auth;

  beforeEach(() => {
    module('inboxApp');
    module('inboxDirectives');
    Auth = {
      any: sinon.stub(),
      has: sinon.stub(),
      online: sinon.stub(),
    };
    module($provide => {
      $provide.value('Auth', Auth);
      $provide.value('$q', Q);
    });
    inject((_$compile_, _$rootScope_) => {
      compile = _$compile_;
      scope = _$rootScope_;
    });
  });

  it('should be shown when auth does not error', done => {
    Auth.has.resolves(true);
    const element = compile('<a mm-auth="can_do_stuff">')(scope);
    scope.$digest();
    setTimeout(() => {
      chai.expect(element.hasClass('hidden')).to.equal(false);
      chai.expect(Auth.has.callCount).to.equal(1);
      chai.expect(Auth.has.args[0][0]).to.deep.equal(['can_do_stuff']);
      done();
    });
  });

  it('should be hidden when auth fails', done => {
    Auth.has.resolves(false);
    const element = compile('<a mm-auth="can_do_stuff">')(scope);
    scope.$digest();
    setTimeout(() => {
      chai.expect(element.hasClass('hidden')).to.equal(true);
      chai.expect(Auth.has.callCount).to.equal(1);
      chai.expect(Auth.has.args[0][0]).to.deep.equal(['can_do_stuff']);
      done();
    });
  });

  it('splits comma separated permissions', done => {
    Auth.has.resolves(true);
    const element = compile('<a mm-auth="can_do_stuff,!can_not_do_stuff">')(scope);
    scope.$digest();
    setTimeout(() => {
      chai.expect(element.hasClass('hidden')).to.equal(false);
      chai.expect(Auth.has.callCount).to.equal(1);
      chai.expect(Auth.has.args[0][0]).to.deep.equal(['can_do_stuff', '!can_not_do_stuff']);
      done();
    });
  });

  describe('mmAuthOnline', () => {
    it('should be shown when auth does not error', (done) => {
      Auth.online.returns(true);
      const element = compile('<a mm-auth mm-auth-online="true">')(scope);
      scope.$digest();
      setTimeout(() => {
        chai.expect(element.hasClass('hidden')).to.equal(false);
        chai.expect(Auth.online.callCount).to.equal(1);
        chai.expect(Auth.online.args[0]).to.deep.equal([true]);
        done();
      });
    });

    it('should be hidden when auth errors', (done) => {
      Auth.online.returns(false);
      const element = compile('<a mm-auth mm-auth-online="false">')(scope);
      scope.$digest();
      setTimeout(() => {
        chai.expect(element.hasClass('hidden')).to.equal(true);
        chai.expect(Auth.online.callCount).to.equal(1);
        chai.expect(Auth.online.args[0]).to.deep.equal([false]);
        done();
      });
    });

    it('parses the attribute value', (done) => {
      Auth.online.returns(true);
      const element = compile('<a mm-auth mm-auth-online="1 + 2 + 3">')(scope);
      scope.$digest();
      setTimeout(() => {
        chai.expect(element.hasClass('hidden')).to.equal(false);
        chai.expect(Auth.online.callCount).to.equal(1);
        chai.expect(Auth.online.args[0]).to.deep.equal([6]);
        done();
      });
    });
  });

  describe('mmAuth + mmAuthOnline', () => {
    it('should be shown when both do not err', (done) => {
      Auth.has.resolves(true);
      Auth.online.returns(true);

      const element = compile('<a mm-auth="permission_to_have" mm-auth-online="true">')(scope);
      scope.$digest();
      setTimeout(() => {
        chai.expect(element.hasClass('hidden')).to.equal(false);
        chai.expect(Auth.online.callCount).to.equal(1);
        chai.expect(Auth.online.args[0]).to.deep.equal([true]);
        chai.expect(Auth.has.callCount).to.equal(1);
        chai.expect(Auth.has.args[0][0]).to.deep.equal(['permission_to_have']);
        done();
      });
    });

    it('should be hidden when online succeeds and permissions err', (done) => {
      Auth.has.resolves(false);
      Auth.online.returns(true);

      const element = compile('<a mm-auth="permission_to_have" mm-auth-online="false">')(scope);
      scope.$digest();
      setTimeout(() => {
        chai.expect(element.hasClass('hidden')).to.equal(true);
        chai.expect(Auth.online.callCount).to.equal(1);
        chai.expect(Auth.online.args[0]).to.deep.equal([false]);
        chai.expect(Auth.has.callCount).to.equal(1);
        chai.expect(Auth.has.args[0][0]).to.deep.equal(['permission_to_have']);
        done();
      });
    });

    it('should be hidden when online fails and permissions succeed', (done) => {
      Auth.has.resolves(true);
      Auth.online.returns(false);

      const element = compile('<a mm-auth="permission_to_have" mm-auth-online="true">')(scope);
      scope.$digest();
      setTimeout(() => {
        chai.expect(element.hasClass('hidden')).to.equal(true);
        chai.expect(Auth.online.callCount).to.equal(1);
        chai.expect(Auth.online.args[0]).to.deep.equal([true]);
        chai.expect(Auth.has.callCount).to.equal(1);
        chai.expect(Auth.has.args[0][0]).to.deep.equal(['permission_to_have']);
        done();
      });
    });

    it('should be hidden when online fails and auth any succeeds', (done) => {
      Auth.any.resolves(true);
      Auth.online.returns(false);

      const element = compile('<a mm-auth mm-auth-any="[\'permission_to_have\', \'another_permission\']" mm-auth-online="true">')(scope);
      scope.$digest();
      setTimeout(() => {
        chai.expect(element.hasClass('hidden')).to.equal(true);
        done();
      });
    });

    it('should be hidden when both fail', (done) => {
      Auth.has.resolves(false);
      Auth.online.returns(false);

      const element = compile('<a mm-auth="permission_to_have" mm-auth-online="false">')(scope);
      scope.$digest();
      setTimeout(() => {
        chai.expect(element.hasClass('hidden')).to.equal(true);
        chai.expect(Auth.online.callCount).to.equal(1);
        chai.expect(Auth.online.args[0]).to.deep.equal([false]);
        chai.expect(Auth.has.callCount).to.equal(1);
        chai.expect(Auth.has.args[0][0]).to.deep.equal(['permission_to_have']);
        done();
      });
    });
  });

  describe('- any', () => {
    it('should be hidden with false parameter(s)', (done) => {
      const element = compile('<a mm-auth mm-auth-any="false">')(scope);
      const element2 = compile('<a mm-auth mm-auth-any="[false, false, false]">')(scope);
      scope.$digest();
      setTimeout(() => {
        chai.expect(element.hasClass('hidden')).to.equal(true);
        chai.expect(element2.hasClass('hidden')).to.equal(true);
        chai.expect(Auth.any.callCount).to.equal(0);
        done();
      });
    });

    it('should be shown with true parameter(s)', (done) => {
      const element = compile('<a mm-auth mm-auth-any="true">')(scope);
      const element2 = compile('<a mm-auth mm-auth-any="[false, false, true, false, true]">')(scope);
      scope.$digest();
      setTimeout(() => {
        chai.expect(element.hasClass('hidden')).to.equal(false);
        chai.expect(element2.hasClass('hidden')).to.equal(false);
        chai.expect(Auth.any.callCount).to.equal(0);
        done();
      });
    });

    it('should be shown with at least one allowed permission', (done) => {
      const element = compile('<a mm-auth mm-auth-any="[\'perm1\', \'perm2\']">')(scope);
      Auth.any.resolves(true);

      scope.$digest();
      setTimeout(() => {
        chai.expect(element.hasClass('hidden')).to.equal(false);
        chai.expect(Auth.any.callCount).to.equal(1);
        chai.expect(Auth.any.args[0][0]).to.deep.equal([['perm1'], ['perm2']]);
        done();
      });
    });

    it('should be hidden with no allowed permissions', (done) => {
      const element = compile('<a mm-auth mm-auth-any="[\'perm1\', \'perm2\']">')(scope);
      Auth.any.resolves(false);
      scope.$digest();
      setTimeout(() => {
        chai.expect(element.hasClass('hidden')).to.equal(true);
        chai.expect(Auth.any.callCount).to.equal(1);
        chai.expect(Auth.any.args[0][0]).to.deep.equal([['perm1'], ['perm2']]);
        done();
      });
    });

    it('should work with stacked permissions', (done) => {
      const element = compile('<a mm-auth mm-auth-any="[[\'a\', \'b\'], [[\'c\', \'d\']], [[[\'e\', \'f\']]], \'g\']">')(scope);
      Auth.any.withArgs([['a', 'b'], ['c', 'd'], ['e', 'f'], ['g']]).resolves(true);
      scope.$digest();

      setTimeout(() => {
        chai.expect(element.hasClass('hidden')).to.equal(false);
        chai.expect(Auth.any.callCount).to.equal(1);
        chai.expect(Auth.any.args[0][0]).to.deep.equal([['a', 'b'], ['c', 'd'], ['e', 'f'], ['g']]);
        done();
      });
    });

    it('should work with expressions ', (done) => {
      const element = compile('<a mm-auth mm-auth-any="[true && [\'a\', \'b\'], false && [\'c\', \'d\'], \'f\']">')(scope);
      Auth.any.withArgs([['a', 'b'], ['f']]).resolves(false);
      scope.$digest();

      setTimeout(() => {
        chai.expect(element.hasClass('hidden')).to.equal(true);
        chai.expect(Auth.any.callCount).to.equal(1);
        chai.expect(Auth.any.args[0][0]).to.deep.equal([['a', 'b'], ['f']]);
        done();
      });
    });
  });

});
